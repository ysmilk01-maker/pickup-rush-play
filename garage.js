// Reserve cars from the same proven exit order. Reintroducing a subset of the
// original board cannot invalidate that order; entry waits for a clear route.
export function garagePlan(cars,level){
 if(level<10)return null;
 const waves=level<30?1:level<60?2:3,size=level<60?4:5;
 const fractions=waves===1?[.5]:waves===2?[.42,.74]:[.38,.61,.84];
 return {waves:fractions.map((f,i)=>({gate:i%2,trigger:8+i*10,
  cars:cars.slice(Math.min(cars.length-size,Math.floor(cars.length*f)),Math.min(cars.length-size,Math.floor(cars.length*f))+size).map(c=>({...c}))})),arrived:0};
}
export const pendingCars=state=>state.garage?.waves.flatMap(w=>w.cars)||[];
export const nextWave=state=>state.garage?.waves.find(w=>w.cars.length);
export function garageStatus(state,arriving=[]){
 const wave=nextWave(state),pending=pendingCars(state).length;
 if(arriving.length)return {text:`차고 ${arriving[0].gate?'B':'A'} · 새 셔틀 진입 중`,pending:pending+1,wave};
 if(!wave)return {text:'추가 입차 완료',pending:0,wave:null};
 const left=Math.max(0,wave.trigger-state.moves);
 return {text:`차고 ${wave.gate?'B':'A'} · ${left?`${left}대 배차 후`:'진입로가 비면'} 입차`,pending,wave};
}

// Optional priority only: original car order/membership and automatic entry remain intact.
export function routeOptions(state){
 const wave=nextWave(state);
 if(state.status!=='playing'||state.levelIndex<14||(state.levelIndex+1)%5||!wave||wave.preferredId||state.moves>=wave.trigger)return [];
 const first=wave.cars[0],other=wave.cars.find(c=>c.color!==first?.color);
 return first&&other?[first,other]:[];
}
export function chooseRoute(state,id){
 if(!routeOptions(state).some(c=>c.id===id))return false;
 nextWave(state).preferredId=id;return true;
}
