import {checkpoint} from './session.js?v=52';
import {canExit} from './game.js?v=52';
import {hiddenCar} from './puzzle.js?v=52';

export const ITEMS=[
 {id:'bay',name:'승강장 확장권',icon:'＋',price:60,color:'#ffdaa1',description:'광고 없이 승강장 한 칸을 즉시 열어요.',detail:'이번 운행에서만 적용 · 최대 7칸 · 확장 시 별 1개'},
 {id:'navigator',name:'자동 길잡이',icon:'➤',price:45,color:'#bce9dd',description:'다음에 보낼 수 있는 셔틀을 계속 표시해요.',detail:'이번 운행 내내 적용 · 자동 배차 아님 · 사용 시 최고 별 2개'},
 {id:'manifest',name:'대기열 미리보기',icon:'▤',price:25,color:'#ddcdf6',description:'화면 밖 손님까지 전체 색상 순서를 확인해요.',detail:'이번 운행에서 여러 번 열람 · 사용 시 최고 별 2개'}
];
export const BUNDLE={id:'starter',name:'든든한 운행 세트',price:110,contents:{bay:1,navigator:1,manifest:1}};
export const ITEM_LIMIT=99;
export function inventory(raw){return Object.fromEntries(ITEMS.map(({id})=>[id,Number.isInteger(raw?.[id])?Math.max(0,Math.min(ITEM_LIMIT,raw[id])):0]));}
export function purchase(save,id,commit=()=>{}){
 const item=ITEMS.find(x=>x.id===id),offer=item|| (id===BUNDLE.id?BUNDLE:null);
 if(!offer)return {ok:false,reason:'unknown'};
 const contents=item?{[id]:1}:offer.contents,bag=inventory(save.inventory);
 if(save.coins<offer.price)return {ok:false,reason:'coins'};
 if(Object.entries(contents).some(([k,n])=>bag[k]+n>ITEM_LIMIT))return {ok:false,reason:'limit'};
 for(const [k,n] of Object.entries(contents))bag[k]+=n;
 const next={...save,coins:save.coins-offer.price,inventory:bag};
 try{commit(next);}catch{return {ok:false,reason:'storage'};}
 Object.assign(save,next);return {ok:true};
}
export function itemAvailability(m,run,id){
 if(!ITEMS.some(x=>x.id===id))return 'unknown';
 if(!m||!run)return 'start';
 if(run.practice)return 'practice';
 if(m.busy)return 'busy';
 if(m.state.status==='won')return 'ended';
 if(id==='bay')return m.state.bays.length>=7?'max':null;
 if(run.tools?.[id])return 'active';
 if(m.state.status!=='playing')return 'lost';
 return null;
}
export function useItem(save,m,run,id,commit=()=>{}){
 const reason=itemAvailability(m,run,id);if(reason)return {ok:false,reason};
 const bag=inventory(save.inventory);if(!bag[id])return {ok:false,reason:'empty'};
 const oldBays=m.state.bays.slice(),oldStatus=m.state.status,oldRun=structuredClone(run);
 if(id==='bay'){if(!m.addBay())return {ok:false,reason:'max'};}
 else {run.tools={...run.tools,[id]:true};run.hints++;}
 const next={...save,inventory:{...bag,[id]:bag[id]-1},activeSession:checkpoint(m,run)};
 try{if(!next.activeSession)throw new Error('unsettled');commit(next);}
 catch{m.state.bays=oldBays;m.state.status=oldStatus;for(const key of Object.keys(run))delete run[key];Object.assign(run,oldRun);return {ok:false,reason:'storage'};}
 Object.assign(save,next);return {ok:true};
}
// Suggestions show legal, visible options; they do not promise a winning solution.
const navigationCache=new WeakMap();
export function navigationSuggestion(m,run){
 if(!run?.tools?.navigator||m.busy||m.state.status!=='playing'||m.state.bays.every(Boolean))return null;
 const key=[m.state.moves,m.delivered,m.state.queue[0],m.state.cars.map(c=>c.id+!!c.revealed).join(','),(m.state.puzzle?.gates||[]).map(g=>g.open).join(',')].join(':');
 const cached=navigationCache.get(m);if(cached?.state===m.state&&cached.key===key)return cached.car;
 const legal=m.state.cars.filter(c=>!hiddenCar(c)&&canExit(m.state,c));
 const car=legal.find(c=>c.color===m.state.queue[0])||legal[0]||null;
 navigationCache.set(m,{state:m.state,key,car});return car;
}
export function queueGroups(queue){
 const groups=[];for(const color of queue){const last=groups.at(-1);if(last?.color===color)last.count++;else groups.push({color,count:1});}return groups;
}
