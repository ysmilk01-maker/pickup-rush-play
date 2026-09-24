import {TOTAL_LEVELS} from './campaign.js?v=25';
export {TOTAL_LEVELS};
export const THEMES=[
  {id:'lantern',name:'살구빛 등불',price:0,color:'#ffc27d',description:'포근한 골목의 첫 번째 밤'},
  {id:'mint',name:'민트빛 강바람',price:60,color:'#83ead3',description:'강변을 닮은 청량한 불빛'},
  {id:'sakura',name:'벚꽃빛 밤산책',price:120,color:'#ffb4d1',description:'분홍빛으로 물든 축제의 밤'}
];
const integer=(v,min,max,fallback=0)=>Number.isInteger(v)?Math.max(min,Math.min(max,v)):fallback;
export function normalize(raw={}){
  const r=raw&&typeof raw==='object'?raw:{};
  const cleared=[...new Set((Array.isArray(r.cleared)?r.cleared:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<TOTAL_LEVELS))].sort((a,b)=>a-b);
  const stars=Object.fromEntries(cleared.map(n=>[n,integer(r.stars?.[n],1,3,1)]));
  const owned=[...new Set(['lantern',...(r.mint?['mint']:[]),...(Array.isArray(r.owned)?r.owned:[])])].filter(id=>THEMES.some(t=>t.id===id));
  const unlocked=Math.min(TOTAL_LEVELS-1,Math.max(integer(r.unlocked??r.level,0,TOTAL_LEVELS-1),...cleared.map(n=>n+1),0));
  const best={};for(const [k,v] of Object.entries(r.best||{}))if(cleared.includes(Number(k))&&Number.isFinite(v)&&v>0)best[k]=Math.round(v);
  const selected=Number(r.version||0)<3&&r.level===35&&cleared.includes(35)?36:integer(r.level,0,unlocked);
  return {version:3,coins:integer(r.coins,0,999999,60),unlocked,level:Math.min(selected,unlocked),cleared,stars,best,owned,
    decoration:owned.includes(r.decoration)?r.decoration:'lantern',tutorial:!!r.tutorial,
    sound:r.sound!==false,vibration:r.vibration!==false,
    boarded:integer(r.boarded,0,9999999),wins:integer(r.wins,0,9999999),
    claimed:(Array.isArray(r.claimed)?r.claimed:[]).filter(x=>['first','crowd','explorer'].includes(x))};
}
export function starsFor({hints=0,undos=0,bays=4}={}){return bays>4?1:hints||undos?2:3;}
export function complete(save,index,run){
  if(!Number.isInteger(index)||index<0||index>=TOTAL_LEVELS||index>save.unlocked)return null;
  const stars=starsFor(run),previous=save.stars[index]||0,fresh=!save.cleared.includes(index);
  const reward=(fresh?40:5)+Math.max(0,stars-previous)*10;
  if(fresh)save.cleared.push(index);
  save.stars[index]=Math.max(stars,previous);save.coins+=reward;save.wins++;
  save.boarded+=Math.max(0,Math.floor(run.passengers||0));
  save.best[index]=Math.min(save.best[index]||Infinity,Math.max(1,Math.round(run.seconds||1)));
  save.unlocked=Math.min(TOTAL_LEVELS-1,Math.max(save.unlocked,index+1));save.level=Math.min(index+1,TOTAL_LEVELS-1);
  return {reward,stars,fresh,all:save.cleared.length===TOTAL_LEVELS};
}
export function buyTheme(save,id){
  const theme=THEMES.find(t=>t.id===id);if(!theme)return false;
  if(!save.owned.includes(id)){if(save.coins<theme.price)return false;save.coins-=theme.price;save.owned.push(id);}
  save.decoration=id;return true;
}
export const MISSIONS=[
  {id:'first',name:'첫 운행의 설렘',description:'단계 1개 완료',target:1,reward:30,value:s=>s.cleared.length},
  {id:'crowd',name:'북적이는 야시장',description:'완료한 운행으로 손님 500명 수송',target:500,reward:50,value:s=>s.boarded},
  {id:'explorer',name:'골목 탐험가',description:'서로 다른 단계 6개 완료',target:6,reward:100,value:s=>s.cleared.length}
];
export function claimMission(save,id){
  const m=MISSIONS.find(m=>m.id===id);
  if(!m||save.claimed.includes(id)||m.value(save)<m.target)return false;
  save.claimed.push(id);save.coins+=m.reward;return true;
}
