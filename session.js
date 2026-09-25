import {Market} from './market.js?v=42';
import {pendingCars} from './garage.js?v=42';
import {CAPACITY} from './traffic.js?v=42';
import {emergencyLimit} from './emergency.js?v=42';
// Only save settled moments, so reload can never strand a person or a car mid-route.
export function checkpoint(m,run){
  if(m.busy||m.state.status!=='playing')return null;
  return {rules:m.demandVersion,level:m.state.levelIndex,data:JSON.parse(m.snapshot()),run:{...run},undo:m.undoStack.at(-1)||null};
}
export function restoreSession(raw,unlocked){
  try{
    if(!raw||!Number.isInteger(raw.level)||raw.level<0||raw.level>unlocked)return null;
    if(![3,4,5,6].includes(raw.rules)&&raw.level>=36)return null;
    const m=new Market(raw.level,![3,4,5,6].includes(raw.rules),raw.rules>=4,raw.rules),d=raw.data,s=d?.state;
    if(!s||s.levelIndex!==raw.level||s.status!=='playing'||!Array.isArray(s.cars)||!Array.isArray(s.bays)||s.bays.length<4||s.bays.length>7)return null;
    const originals=new Map(m.allCars.map(c=>[c.id,c])),all=[...s.cars,...s.bays.filter(Boolean),...pendingCars(s)],ids=new Set();
    for(const car of all){
      const base=originals.get(car.id);if(!base||ids.has(car.id))return null;ids.add(car.id);
      for(const key of ['x','y','angle','color','type','model','scale'])if(base[key]!==car[key])return null;
    }
    if(raw.rules>=4){
      const plan=m.state.garage;
      if(!!plan!==!!s.garage)return null;
      if(plan){
        if(!Array.isArray(s.garage.waves)||s.garage.waves.length!==plan.waves.length||!Number.isInteger(s.garage.arrived))return null;
        for(let i=0;i<plan.waves.length;i++){
          const a=plan.waves[i],b=s.garage.waves[i];
          if(b.preferredId!==undefined&&(!a.cars.some(c=>c.id===b.preferredId)||raw.level<14||(raw.level+1)%5))return null;
          if(a.gate!==b.gate||a.trigger!==b.trigger||!Array.isArray(b.cars)||b.cars.length>a.cars.length)return null;
          // Automatic admissions can remove a needed color from the middle of a wave.
          // Remaining cars must still be an ordered subset of that same wave.
          let cursor=-1;
          for(const car of b.cars){const index=a.cars.findIndex(c=>c.id===car.id);if(index<=cursor)return null;cursor=index;}
        }
        if(s.garage.arrived!==pendingCars(m.state).length-pendingCars(s).length)return null;
      }
    }else if(s.garage)return null;
    if(!Array.isArray(s.queue)||!Array.isArray(s.people)||s.queue.length!==s.people.length||s.queue.some(c=>!['red','blue','green','yellow','purple','cyan','orange'].includes(c)))return null;
    if(s.people.some(p=>!p||!Number.isInteger(p.id)||typeof p.skin!=='string'||typeof p.hair!=='string'))return null;
    for(let i=0;i<s.bays.length;i++){
      const car=s.bays[i];if(!car)continue;
      if(car.phase!=='parked'||car.slot!==i||car.pending!==0||car.capacity!==CAPACITY[car.type]||!Number.isInteger(car.loaded)||car.loaded<0||car.loaded>=car.capacity)return null;
      if(!Number.isFinite(car.pose?.x)||!Number.isFinite(car.pose?.y)||!Number.isFinite(car.pose?.angle)||!Array.isArray(car.passengers)||car.passengers.length!==car.loaded)return null;
    }
    if(!Number.isInteger(d.delivered)||d.delivered<0||d.delivered+s.queue.length!==m.total||d.queueConsumed!==d.delivered||!Number.isInteger(s.moves)||s.moves<0)return null;
    if(!raw.run||!['hints','undos','seconds'].every(k=>Number.isFinite(raw.run[k])&&raw.run[k]>=0))return null;
    if(s.combo!==undefined&&(!s.combo||!Number.isInteger(s.combo.chain)||!Number.isInteger(s.combo.best)||s.combo.chain<0||s.combo.best<s.combo.chain||s.combo.best>m.allCars.length))return null;
    s.combo??={chain:0,best:0};
    const emergency=s.emergency;
    if(emergency){
      const base=pendingCars(m.state).find(c=>c.id===emergency.id);
      if(raw.rules<6||!base||emergency.color!==base.color||emergency.capacity!==CAPACITY[base.type]||emergency.limit!==emergencyLimit(raw.level))return null;
      if(!Number.isInteger(emergency.remaining)||emergency.remaining<0||emergency.remaining>emergency.limit||!['active','success','missed'].includes(emergency.status)||typeof emergency.announced!=='boolean'||typeof emergency.resultSeen!=='boolean')return null;
      if(pendingCars(s).some(c=>c.id===emergency.id))return null;
      if(emergency.status==='active'&&!all.some(c=>c.id===emergency.id))return null;
      if(emergency.status==='success'&&all.some(c=>c.id===emergency.id))return null;
    }
    if(all.some(c=>c.emergency&&c.id!==emergency?.id))return null;
    Object.assign(m,d);m.queueVisual=m.queueConsumed;
    m.demandVersion=raw.rules>=3?raw.rules:raw.rules===2?2:1;
    if(typeof raw.undo==='string'){
      try{const previous=restoreSession({rules:raw.rules,level:raw.level,data:JSON.parse(raw.undo),run:raw.run},unlocked);if(previous&&previous.market.state.moves<s.moves)m.undoStack=[raw.undo];}catch{}
    }
    return {market:m,run:raw.run};
  }catch{return null;}
}
