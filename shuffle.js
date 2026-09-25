import {canExit} from './game.js?v=56';
import {vehicleModel} from './appearance.js?v=56';
import {pendingCars} from './garage.js?v=56';
import {revealCars} from './puzzle.js?v=56';

const poseKeys=['x','y','angle','dir'];
const pose=c=>Object.fromEntries(poseKeys.map(k=>[k,c[k]]));
function sameSize(a,b){const x=vehicleModel(a),y=vehicleModel(b);return a.type===b.type&&x.length===y.length&&x.width===y.width;}
// Preserve the proven departure order, passenger identities and future garage
// spaces. Swapping equal footprints leaves the lot's occupied geometry intact.
function safeOrder(m,cars){
 const state={...m.state,cars:[...cars,...pendingCars(m.state)],puzzle:m.state.puzzle?{...m.state.puzzle,gates:m.state.puzzle.gates.map(g=>({...g}))}:null};
 for(const id of m.solution){const c=state.cars.find(c=>c.id===id);if(!c)continue;if(!canExit(state,c))return false;state.cars=state.cars.filter(c=>c.id!==id);for(const g of state.puzzle?.gates||[])if(g.keyId===id)g.open=true;}
 return !state.cars.length;
}
export function shuffleParking(m,random=Math.random){
 const cars=m.state.cars.map(c=>({...c})),slots={...m.state.shuffleSlots},pairs=[],used=new Set();
 for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++)if(sameSize(cars[i],cars[j])&&(cars[i].color!==cars[j].color||cars[i].model!==cars[j].model))pairs.push([i,j]);
 for(let i=pairs.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pairs[i],pairs[j]]=[pairs[j],pairs[i]];}
 for(const [i,j] of pairs){
  if(used.has(i)||used.has(j))continue;
  const a=pose(cars[i]),b=pose(cars[j]);Object.assign(cars[i],b);Object.assign(cars[j],a);
  if(!safeOrder(m,cars)){Object.assign(cars[i],a);Object.assign(cars[j],b);continue;}
  const ai=slots[cars[i].id]||cars[i].id,bj=slots[cars[j].id]||cars[j].id;slots[cars[i].id]=bj;slots[cars[j].id]=ai;used.add(i);used.add(j);
 }
 if(!used.size)return {ok:false,reason:'shuffle-unavailable'};
 m.state.cars=cars;m.state.shuffleSlots=slots;m.garageCheckKey=null;revealCars(m);
 return {ok:true,moved:used.size};
}
// Saved poses are a permutation of known equal-size original parking spaces.
export function validShuffleSlots(slots,originals){
 if(slots===undefined)return true;
 if(!slots||typeof slots!=='object'||Array.isArray(slots))return false;
 const seen=new Set();for(const [id,slot] of Object.entries(slots))if(!originals.has(id)||!originals.has(slot)||!sameSize(originals.get(id),originals.get(slot)))return false;
 for(const id of originals.keys()){const slot=slots[id]||id;if(seen.has(slot))return false;seen.add(slot);}
 return true;
}
