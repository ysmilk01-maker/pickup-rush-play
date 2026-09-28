export const TRACKS=[
 {id:'yue2-lobby',title:'야시장 테마 1',subtitle:'대기실 · 골목 산책',src:'./audio/yue2-lobby-instrumental.mp3'},
 {id:'yue2-drive',title:'야시장 테마 2',subtitle:'운행 · 한입특급 출발',src:'./audio/yue2-drive-instrumental.mp3'}
];
const clamp=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;

/** One media element: fade out, replace the source, then fade in on successful play. */
export class MusicPlayer{
 constructor(makeAudio=()=>new Audio(),{makeContext=()=>{
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
  return Context?new Context():null;
 },now=()=>performance.now(),later=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}={}){
  this.audio=makeAudio();this.audio.loop=true;this.audio.preload='none';
  this.makeContext=makeContext;this.now=now;this.later=later;this.cancel=cancel;
  this.enabled=true;this.volume=.3;this.track='auto';this.scene='lobby';
  this.unlocked=false;this.suspended=false;this.ducked=false;this.blocked=false;
  this.current=-1;this.desired=0;this.status='tap';this.generation=0;this.pending=false;
  this.ramp={from:0,to:0,start:0,end:0};this.audio.volume=0;
  this.audio.addEventListener('error',()=>{this.status='error';});
 }
 get allowed(){return this.unlocked&&this.enabled&&!this.suspended;}
 get targetVolume(){return this.volume*(this.ducked?.35:1);}
 levelAt(t=this.now()){
  const r=this.ramp;
  return r.end<=t?r.to:r.from+(r.to-r.from)*Math.max(0,(t-r.start)/(r.end-r.start));
 }
 fade(to,ms=220){
  to=clamp(to);
  if(to===this.ramp.to&&(ms!==0||this.levelAt()===to))return;
  if(this.fadeTimer!=null)this.cancel(this.fadeTimer);
  const start=this.now(),from=this.levelAt(start);
  this.ramp={from,to,start,end:start+ms};
  if(this.gain){
   const gain=this.gain.gain,t=this.context.currentTime;
   gain.cancelScheduledValues(t);gain.setValueAtTime(from,t);gain.linearRampToValueAtTime(to,t+ms/1000);
  }else{
   const step=()=>{this.audio.volume=clamp(this.levelAt());if(this.now()<this.ramp.end)this.fadeTimer=this.later(step,20);else this.fadeTimer=null;};
   step();
  }
 }
 configure({enabled=this.enabled,volume=this.volume,track=this.track,scene=this.scene,suspended=this.suspended,ducked=this.ducked}={}){
  this.enabled=enabled;this.volume=clamp(volume);this.track=track;this.scene=scene;
  this.suspended=suspended;this.ducked=ducked;
  const manual=TRACKS.findIndex(t=>t.id===track);
  this.desired=manual>=0?manual:scene==='game'?1:0;
  if(!this.allowed){
   this.cancelSwitch();this.audio.pause();this.fade(0,0);
   if(this.current!==this.desired)this.select();
   this.status=!enabled?'off':suspended?'paused':'tap';return;
  }
  if(this.desired!==this.current){
   if(this.switchTimer!=null)return;
   if(this.audio.paused){this.select();this.play();}
   else{
    this.fade(0,120);this.status='switching';
    this.switchTimer=this.later(()=>{this.switchTimer=null;this.select();this.play();},130);
   }
   return;
  }
  this.cancelSwitch();
  if(!this.audio.paused&&!this.pending){this.fade(this.targetVolume);this.status='playing';}
  else if(!this.blocked&&this.status!=='error')this.play();
 }
 cancelSwitch(){if(this.switchTimer!=null)this.cancel(this.switchTimer);this.switchTimer=null;}
 select(){
  this.audio.pause();this.fade(0,0);this.current=this.desired;this.generation++;
  this.audio.src=TRACKS[this.current].src;this.status='tap';
 }
 async play(){
  if(!this.allowed||this.pending||this.switchTimer!=null||this.blocked||this.status==='error')return;
  if(this.current<0)this.select();
  const generation=this.generation;this.pending=true;
  try{
   // Start both operations inside the gesture, before yielding to a promise.
   const resumed=this.context?.state==='suspended'?this.context.resume():Promise.resolve();
   const started=this.audio.play();
   await Promise.all([resumed,started]);
   if(!this.allowed){this.audio.pause();return;}
   if(generation===this.generation&&this.switchTimer==null){this.status='playing';this.fade(this.targetVolume,350);}
  }catch(error){
   if(generation===this.generation){
    this.blocked=error?.name==='NotAllowedError';
    this.status=this.blocked||error?.name==='AbortError'?'tap':'error';
   }
  }finally{
   this.pending=false;
   if(generation!==this.generation&&this.allowed)this.play();
  }
 }
 unlock(){
  this.unlocked=true;this.blocked=false;
  if(!this.contextAttempted){
   this.contextAttempted=true;
   try{
    const context=this.makeContext();
    if(context){
     const gain=context.createGain(),source=context.createMediaElementSource(this.audio);
     gain.gain.value=this.levelAt();source.connect(gain);gain.connect(context.destination);
     this.context=context;this.gain=gain;this.source=source;this.audio.volume=1;
     if(this.fadeTimer!=null)this.cancel(this.fadeTimer);this.fadeTimer=null;
    }
   }catch{/* Volume ramps on the media element remain available without Web Audio. */}
  }
  this.configure();
 }
}
