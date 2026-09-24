import {Market} from './market.js?v=23';
import {CAPACITY} from './traffic.js?v=23';
// Only save settled moments, so reload can never strand a person or a car mid-route.
export function checkpoint(m,run){
  if(m.busy||m.state.status!=='playing')return null;
  return {level:m.state.levelIndex,data:JSON.parse(m.snapshot()),run:{...run},undo:m.undoStack.at(-1)||null};
}
export function restoreSession(raw,unlocked){
  try{
    if(!raw||!Number.isInteger(raw.level)||raw.level<0||raw.level>unlocked)return null;
    const m=new Market(raw.level),d=raw.data,s=d?.state;
    if(!s||s.levelIndex!==raw.level||s.status!=='playing'||!Array.isArray(s.cars)||!Array.isArray(s.bays)||s.bays.length<4||s.bays.length>7)return null;
    const originals=new Map(m.state.cars.map(c=>[c.id,c])),all=[...s.cars,...s.bays.filter(Boolean)],ids=new Set();
    for(const car of all){
      const base=originals.get(car.id);if(!base||ids.has(car.id))return null;ids.add(car.id);
      for(const key of ['x','y','angle','color','type','model','scale'])if(base[key]!==car[key])return null;
    }
    if(!Array.isArray(s.queue)||!Array.isArray(s.people)||s.queue.length!==s.people.length||s.queue.some(c=>!['red','blue','green','yellow','purple','cyan','orange'].includes(c)))return null;
    if(s.people.some(p=>!p||!Number.isInteger(p.id)||typeof p.skin!=='string'||typeof p.hair!=='string'))return null;
    for(let i=0;i<s.bays.length;i++){
      const car=s.bays[i];if(!car)continue;
      if(car.phase!=='parked'||car.slot!==i||car.pending!==0||car.capacity!==CAPACITY[car.type]||!Number.isInteger(car.loaded)||car.loaded<0||car.loaded>=car.capacity)return null;
      if(!Number.isFinite(car.pose?.x)||!Number.isFinite(car.pose?.y)||!Number.isFinite(car.pose?.angle)||!Array.isArray(car.passengers)||car.passengers.length!==car.loaded)return null;
    }
    if(!Number.isInteger(d.delivered)||d.delivered<0||d.delivered+s.queue.length!==m.total||d.queueConsumed!==d.delivered||!Number.isInteger(s.moves)||s.moves<0)return null;
    if(!raw.run||!['hints','undos','seconds'].every(k=>Number.isFinite(raw.run[k])&&raw.run[k]>=0))return null;
    Object.assign(m,d);m.queueVisual=m.queueConsumed;
    if(typeof raw.undo==='string'){
      try{const previous=restoreSession({level:raw.level,data:JSON.parse(raw.undo),run:raw.run},unlocked);if(previous&&previous.market.state.moves<s.moves)m.undoStack=[raw.undo];}catch{}
    }
    return {market:m,run:raw.run};
  }catch{return null;}
}
