import {canExit} from './game.js?v=58';
import {hiddenCar} from './puzzle.js?v=58';

export const CUT_LIMIT=3;
export const cutCount=level=>level<30?2:3;
export const cutActive=q=>q?.status==='offered'||q?.status==='entering'||q?.status==='active';
const settled=t=>!t.running.length&&!t.walkers.length&&!t.arriving.length;

// Reorder real passengers, never invent demand that the remaining fleet cannot carry.
export function beginQueueCut(t){
 const s=t.state;
 if(t.demandVersion<8||s.levelIndex<4||s.puzzle?.tutorial||s.queueCut||s.emergency?.status==='active'||s.status!=='playing'||!settled(t)||s.moves<3+s.levelIndex%3||!s.bays.some(b=>!b))return false;
 // The first remaining vehicle in the proven exit order keeps the event actionable.
 const car=t.solution.map(id=>s.cars.find(c=>c.id===id)).find(Boolean);
 if(!car||hiddenCar(car)||!canExit(s,car)||car.color===s.queue[0]||s.bays.some(c=>c?.color===car.color))return false;
 const indices=s.queue.map((color,i)=>color===car.color&&i>=3?i:-1).filter(i=>i>=0).slice(0,cutCount(s.levelIndex));
 if(indices.length!==cutCount(s.levelIndex))return false;
 const guests=indices.map(i=>s.people[i]);
 s.queueCut={color:car.color,ids:guests.map(p=>p.id),originOrder:s.people.map(p=>p.id),boarded:[],targetCar:car.id,
  limit:CUT_LIMIT,remaining:CUT_LIMIT,status:'offered',elapsed:0,announced:false,resultSeen:false};
 return true;
}

export function chooseQueueCut(t,accept){
 const q=t.state.queueCut;if(q?.status!=='offered'||!settled(t))return false;
 q.announced=true;
 if(!accept){q.status='declined';q.resultSeen=true;return true;}
 const pairs=t.state.queue.map((color,i)=>({color,person:t.state.people[i]}));
 const guests=q.ids.map(id=>pairs.find(p=>p.person.id===id)),chosen=new Set(q.ids);
 if(guests.some(p=>!p))return false;
 const reordered=[...guests,...pairs.filter(p=>!chosen.has(p.person.id))];
 t.state.queue=reordered.map(p=>p.color);t.state.people=reordered.map(p=>p.person);
 q.status='entering';t.queueVisual=t.queueConsumed;t.onEvent?.({type:'cutin'});return true;
}

export function restoreCutOrder(t){
 const q=t.state.queueCut,rank=new Map(q.originOrder.map((id,i)=>[id,i]));
 const pairs=t.state.queue.map((color,i)=>({color,person:t.state.people[i]}));
 pairs.sort((a,b)=>rank.get(a.person.id)-rank.get(b.person.id));
 t.state.queue=pairs.map(p=>p.color);t.state.people=pairs.map(p=>p.person);
 t.queueVisual=t.queueConsumed;q.status='missed';
 t.onEvent?.({type:'cutReturn'});
}

export function tickQueueCut(t,dt){
 const q=t.state.queueCut;
 if(q?.status==='entering'){
  q.elapsed=Math.min(.9,q.elapsed+dt);
  if(q.elapsed>=.9)q.status='active';
 }
 if(q?.status==='active'){
  if(q.boarded.length===q.ids.length){q.status='success';t.onEvent?.({type:'cutSuccess'});}
  else if(settled(t)&&(q.remaining===0||(t.state.bays.every(Boolean)&&!t.state.bays.some(c=>c?.color===t.state.queue[0]))))restoreCutOrder(t);
 }
 if(!q)beginQueueCut(t);
}

export function validQueueCut(q,m,s){
 if(!q)return true;
 if(m.demandVersion<8||s.levelIndex<4||s.puzzle?.tutorial||!['offered','declined','active','success','missed'].includes(q.status)||q.elapsed!==(['offered','declined'].includes(q.status)?0:.9)||q.limit!==CUT_LIMIT||!Number.isInteger(q.remaining)||q.remaining<0||q.remaining>CUT_LIMIT||typeof q.announced!=='boolean'||typeof q.resultSeen!=='boolean')return false;
 const car=m.allCars.find(c=>c.id===q.targetCar),base=m.state.queue;
 if(!car||car.color!==q.color||!Array.isArray(q.ids)||q.ids.length!==cutCount(s.levelIndex)||new Set(q.ids).size!==q.ids.length||q.ids.some(id=>!Number.isInteger(id)||base[id]!==q.color))return false;
 if(!Array.isArray(q.originOrder)||new Set(q.originOrder).size!==q.originOrder.length||q.originOrder.some(id=>!Number.isInteger(id)||id<0||id>=m.total)||q.ids.some(id=>!q.originOrder.includes(id)))return false;
 if(!Array.isArray(q.boarded)||new Set(q.boarded).size!==q.boarded.length||q.boarded.some(id=>!q.ids.includes(id)))return false;
 if(['offered','declined'].includes(q.status)&&(q.remaining!==CUT_LIMIT||q.boarded.length))return false;
 if(q.status==='offered'&&(s.people.length!==q.originOrder.length||s.people.some((p,i)=>p.id!==q.originOrder[i])))return false;
 const waiting=new Set(s.people.map(p=>p.id));
 if(!['missed','declined'].includes(q.status)&&q.ids.some(id=>q.boarded.includes(id)===waiting.has(id)))return false;
 if(s.people.some(p=>!q.originOrder.includes(p.id)))return false;
 if((q.status==='success')!==(q.boarded.length===q.ids.length))return false;
 if(['offered','active'].includes(q.status)&&s.emergency?.status==='active')return false;
 return true;
}
