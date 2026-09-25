import {blockers,bounds,overlaps,LOT,GROUND_SCALE} from './geometry.js?v=47';

export const closedGates=state=>(state.puzzle?.gates||[]).filter(g=>!g.open);
export function gateBlockers(car,gates){
 if(!gates.length)return [];
 const b=bounds(car),dx=Math.cos(car.angle),dy=Math.sin(car.angle)*GROUND_SCALE;
 const exit=Math.min(dx>1e-9?(LOT.right-b.left)/dx:dx< -1e-9?(LOT.left-b.right)/dx:Infinity,dy>1e-9?(LOT.bottom-b.top)/dy:dy< -1e-9?(LOT.top-b.bottom)/dy:Infinity)+4;
 return blockers(car,gates).filter(b=>b.hit.entry<=exit);
}
export const exitBlockers=(state,car)=>[...blockers(car,state.cars),...gateBlockers(car,closedGates(state))].sort((a,b)=>a.hit.entry-b.hit.entry);
export const hiddenCar=car=>!!car.covered&&!car.revealed;
export function outsideLot(car){const b=bounds(car);return b.right<LOT.left||b.left>LOT.right||b.bottom<LOT.top||b.top>LOT.bottom;}

// Place a physical barrier across an exit ray. Every affected vehicle must
// follow its key in the existing proven solution; no random dead ends.
export function createPuzzle(cars,allCars,level,solution){
 const puzzle={gates:[],covered:[],tutorial:level===20?'cover':level===40?'gate':null};
 const order=new Map(solution.map((id,i)=>[id,i]));
 const wanted=level<40?0:level<70?1:2;
 const options=[];
 for(const car of cars){
  const dx=Math.cos(car.angle),dy=Math.sin(car.angle)*GROUND_SCALE;
  const distance=Math.min(...[(LOT.left-car.x)/dx,(LOT.right-car.x)/dx,(LOT.top-car.y)/dy,(LOT.bottom-car.y)/dy].filter(n=>Number.isFinite(n)&&n>0));
  const gate={id:'',barrier:true,length:58,width:8,x:car.x+dx*distance,y:car.y+dy*distance,angle:car.angle+Math.PI/2,open:false};
  if(allCars.some(c=>overlaps(c,gate,3)))continue;
  const affected=allCars.filter(c=>gateBlockers(c,[gate]).length);
  const first=Math.min(...affected.map(c=>order.get(c.id)));
  const key=[...cars].reverse().find(c=>order.get(c.id)<first&&order.get(c.id)>=2);
  if(!key)continue;
  options.push({...gate,keyId:key.id,targetId:car.id,first,affected:affected.map(c=>c.id)});
 }
 options.sort((a,b)=>a.first-b.first||a.targetId.localeCompare(b.targetId));
 for(const gate of options){
  if(puzzle.gates.length===wanted)break;
  if(puzzle.gates.some(g=>g.keyId===gate.keyId||overlaps(g,gate,12)))continue;
  // A key for an earlier gate must never depend on a later gate.
  if(puzzle.gates.some(g=>gate.affected.includes(g.keyId)))continue;
  const {first,affected,...saved}=gate;
  saved.id=`gate-${puzzle.gates.length+1}`;puzzle.gates.push(saved);
 }
 if(puzzle.gates.length!==wanted)throw Error(`Stage ${level+1}: no safe gate placement`);
 const count=level<20||level===40?0:level<30?1:level<60?2:3;
 const state={cars,puzzle};
 for(const car of cars){
  if(puzzle.covered.length>=count)break;
  if(puzzle.gates.some(g=>g.keyId===car.id)||!exitBlockers(state,car).length)continue;
  car.covered=true;car.revealed=false;puzzle.covered.push(car.id);
 }
 return puzzle;
}

export function revealCars(traffic){
 const state=traffic.state;if(!state.puzzle)return;
 const moving=traffic.running.filter(c=>c.phase==='driving'&&!c.fromGarage&&!outsideLot({...c,...c.pose})).map(c=>({...c,...c.pose}));
 for(const car of state.cars){
  if(hiddenCar(car)&&!exitBlockers({...state,cars:[...state.cars,...moving]},car).length){
   car.revealed=true;traffic.onEvent?.({type:'reveal',carId:car.id});
  }
 }
}
export function unlockFromVehicle(traffic,car){
 if(car.phase!=='driving'||car.fromGarage||!outsideLot({...car,...car.pose}))return;
 for(const gate of traffic.state.puzzle?.gates||[])if(!gate.open&&gate.keyId===car.id){
  gate.open=true;traffic.garageCheckKey=null;traffic.onEvent?.({type:'gate',gateId:gate.id,carId:car.id});
 }
}

// Validate saved puzzle identity and progress against the generated stage.
export function validPuzzle(saved,initial,state){
 if(!saved||JSON.stringify(saved.covered)!==JSON.stringify(initial.covered)||saved.tutorial!==initial.tutorial||!Array.isArray(saved.gates)||saved.gates.length!==initial.gates.length)return false;
 for(let i=0;i<initial.gates.length;i++){
  const a=initial.gates[i],b=saved.gates[i];
  if(Object.keys(a).some(k=>k!=='open'&&a[k]!==b[k])||typeof b.open!=='boolean')return false;
  if(b.open===state.cars.some(c=>c.id===a.keyId))return false;
 }
 for(const car of [...state.cars,...state.bays.filter(Boolean)]){
  const covered=initial.covered.includes(car.id);
  if(covered!==!!car.covered||covered&&typeof car.revealed!=='boolean')return false;
  if(covered&&state.bays.includes(car)&&!car.revealed)return false;
  if(covered&&!car.revealed&&!exitBlockers(state,car).length)return false;
 }
 return true;
}
