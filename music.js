export const TRACKS=[
 {id:'lantern',title:'Lantern Lane Loop',subtitle:'등불 골목 · 밝고 통통 튀는 리듬',src:'./audio/lantern-lane.mp3'}
];
export class MusicPlayer{
 constructor(makeAudio=()=>new Audio()){
  this.audio=makeAudio();this.audio.loop=true;this.audio.preload='none';this.unlocked=false;
  this.enabled=true;this.volume=.3;this.track='auto';this.level=0;this.suspended=false;this.ducked=false;this.current=-1;this.status='tap';
  this.audio.addEventListener('error',()=>{this.status='error';});
 }
 configure({enabled=this.enabled,volume=this.volume,track=this.track,level=this.level,suspended=this.suspended,ducked=this.ducked}={}){
  this.enabled=enabled;this.volume=Math.max(0,Math.min(1,volume));this.track=track;this.level=level;this.suspended=suspended;this.ducked=ducked;
  const i=track==='auto'?Math.min(TRACKS.length-1,level>=50?1:0):Math.max(0,TRACKS.findIndex(t=>t.id===track));
  if(i!==this.current){this.audio.pause();this.current=i;this.audio.src=TRACKS[i].src;this.status='tap';}
  this.audio.volume=this.volume*(ducked?.35:1);
  if(!this.enabled||this.suspended){this.audio.pause();this.status=this.enabled?'paused':'off';return;}
  if(this.unlocked&&this.audio.paused&&this.status!=='error')this.play();
 }
 async play(){
  if(!this.unlocked||!this.enabled||this.suspended||this.pending)return;
  this.pending=true;
  try{await this.audio.play();if(this.suspended||!this.enabled)this.audio.pause();else this.status='playing';}
  catch(e){this.status=e?.name==='NotAllowedError'?'tap':'error';}
  finally{this.pending=false;}
 }
 unlock(){this.unlocked=true;this.play();}
}
