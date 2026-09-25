// Original procedural effects. No downloads, speech recordings or third-party samples.
export const EFFECT_NAMES={ui:'메뉴 선택',select:'차량 출발',blocked:'길 막힘',arrival:'승강장 도착',board:'승객 탑승',depart:'만차 출발',combo:'연속 만차',clear:'클리어',lose:'승강장 가득 참',emergency:'응급차 사이렌'};
const LIMITS={ui:.07,select:.08,blocked:.22,arrival:.16,board:.07,depart:.18,combo:.25,clear:1,lose:.5,emergency:2};
export class SoundEffects{
 constructor(makeContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()){
  this.makeContext=makeContext;this.context=null;this.enabled=true;this.volume=.65;this.suspended=false;this.unlocked=false;this.voices=new Set();this.last=new Map();this.step=0;
 }
 configure({enabled=this.enabled,volume=this.volume,suspended=this.suspended}={}){
  this.enabled=enabled;this.volume=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):.65;this.suspended=suspended;
  if(!enabled||suspended||!this.volume)this.stop();
  if(this.master)this.master.gain.setTargetAtTime(this.enabled&&!this.suspended?this.volume:0,this.context.currentTime,.015);
 }
 unlock(){
  if(!this.enabled||this.suspended)return Promise.resolve(false);
  try{
   if(!this.context||this.context.state==='closed'){
    const c=this.context=this.makeContext();this.master=c.createGain();this.master.gain.value=this.volume;
    const limiter=c.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.12;
    this.master.connect(limiter);limiter.connect(c.destination);
    this.noise=c.createBuffer(1,Math.ceil(c.sampleRate*.5),c.sampleRate);const data=this.noise.getChannelData(0);let seed=7817;
    for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=seed/1073741823.5-1;}
   }
   this.unlocked=true;
   return Promise.resolve(this.context.resume()).then(()=>true).catch(()=>false);
  }catch{return Promise.resolve(false);}
 }
 stop(){for(const voice of [...this.voices]){try{voice.source.stop();}catch{}voice.dispose();}this.last.clear();}
 tone(frequency,duration,gain=.07,delay=0,type='sine',end=frequency){
  const c=this.context,source=c.createOscillator();source.type=type;source.frequency.setValueAtTime(frequency,c.currentTime+delay);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),c.currentTime+delay+duration);
  this.voice(source,duration,gain,delay);
 }
 hiss(duration,gain,frequency,delay=0){
  const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter();source.buffer=this.noise;filter.type='lowpass';filter.frequency.value=frequency;source.connect(filter);this.voice(source,duration,gain,delay,filter);
 }
 voice(source,duration,level,delay,filter){
  if(this.voices.size>=24){try{source.disconnect();filter?.disconnect();}catch{}return;}
  const c=this.context,envelope=c.createGain(),at=c.currentTime+delay;
  envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(level,at+.008);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);envelope.gain.setValueAtTime(0,at+duration+.012);
  (filter||source).connect(envelope);envelope.connect(this.master);
  const voice={source,dispose:()=>{source.disconnect();filter?.disconnect();envelope.disconnect();this.voices.delete(voice);}};source.onended=voice.dispose;this.voices.add(voice);source.start(at);source.stop(at+duration+.025);
 }
 play(name){
  const c=this.context;if(!EFFECT_NAMES[name]||!this.enabled||this.suspended||!this.volume||!this.unlocked||!c||c.state!=='running')return false;
  const now=c.currentTime;if(now-(this.last.get(name)??-Infinity)<LIMITS[name])return false;this.last.set(name,now);
  try{
   switch(name){
    case 'emergency':for(let i=0;i<4;i++)this.tone(i%2?960:600,.42,.055,i*.32,'triangle',i%2?600:960);break;
    case 'ui':this.tone(660,.055,.045);break;
    case 'select':this.tone(740,.065,.065);this.tone(150,.19,.045,.035,'triangle',260);break;
    case 'blocked':this.tone(145,.105,.085,0,'triangle',105);this.tone(145,.12,.065,.13,'triangle',90);this.hiss(.06,.08,480);break;
    case 'arrival':this.hiss(.20,.10,1500);this.tone(740,.16,.045,.07);this.tone(988,.18,.04,.18);break;
    case 'board':{const note=[523,659,784,880,1047][this.step++%5];this.hiss(.045,.075,950);this.tone(note,.095,.037,.025);break;}
    case 'depart':this.tone(180,.32,.065,0,'triangle',330);this.tone(523,.11,.035,.04);this.tone(659,.13,.035,.16);break;
    case 'combo':[784,988,1175].forEach((n,i)=>this.tone(n,.16,.055,i*.065));break;
    case 'clear':this.stop();this.last.set(name,now);[523,659,784,1047].forEach((n,i)=>this.tone(n,i===3?.65:.23,.075,i*.14));this.tone(262,.9,.03,.1,'triangle');this.tone(784,.5,.035,.47);break;
    case 'lose':this.tone(330,.22,.06,0,'triangle');this.tone(262,.4,.045,.22,'triangle');break;
   }
   return true;
  }catch{this.stop();return false;}
 }
}
