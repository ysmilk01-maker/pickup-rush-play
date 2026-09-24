import { Traffic, BAY, ANIMATION_SPEED, pathPose, smoothPath } from './traffic.js?v=16';
import { canExit } from './game.js?v=16';

export const INGREDIENTS = {
  dough: {name:'반죽',icon:'🥟',color:'#f5d9a0'},
  tomato: {name:'토마토',icon:'🍅',color:'#ff6868'},
  cheese: {name:'치즈',icon:'🧀',color:'#ffd85c'},
  greens: {name:'채소',icon:'🥬',color:'#6ed592'},
  meat: {name:'고기',icon:'🍖',color:'#df937f'},
  rice: {name:'떡',icon:'🍡',color:'#fff2cf'}
};
export const RECIPES = {
  pizza: {name:'화덕 피자',short:'피자',icon:'🍕',color:'red',needs:{dough:1,tomato:1,cheese:1}},
  burger: {name:'수제 버거',short:'버거',icon:'🍔',color:'yellow',needs:{dough:1,greens:1,meat:1}},
  tteok: {name:'달콤 떡볶이',short:'떡볶이',icon:'🍢',color:'orange',needs:{rice:2,tomato:1}},
  taco: {name:'바삭 타코',short:'타코',icon:'🌮',color:'green',needs:{dough:1,greens:1,tomato:1}},
  skewer: {name:'직화 꼬치',short:'꼬치',icon:'🍖',color:'purple',needs:{meat:2,greens:1}},
  melt: {name:'치즈 토스트',short:'토스트',icon:'🥪',color:'cyan',needs:{dough:2,cheese:1}}
};
export const MARKET_LEVELS = [
  '첫 번째 불빛','골목의 저녁','치즈 쟁탈전','타코의 등장',
  '강변 푸드 페스타','강바람 저녁 장사','꼬치 굽는 밤','별빛 미식회',
  '항구의 불금','토스트의 향기','전국 야시장','한입 그랜드 오픈'
];
export const PANTRY = key => ({x:48+Object.keys(INGREDIENTS).indexOf(key)*101,y:214});
const clone=value=>JSON.parse(JSON.stringify(value));

// Orders are generated from a proved exit sequence. A rolling menu permits
// alternative recipes, while reserving an order before consuming its ingredients
// ensures another truck cannot silently steal the last ingredients it needs.
export class Market extends Traffic {
  constructor(level=0) {
    super(level);
    this.state.queue=[];this.state.people=[];
    this.state.levelTitle=MARKET_LEVELS[this.state.levelIndex];
    this.completed=0;this.delivered=0;this.orders=[];this.nextOrder=0;
    this.stock=Object.fromEntries(Object.keys(INGREDIENTS).map(k=>[k,0]));
    this.preferred=null;this.featuredWon=false;this.celebrations=[];
    const keys=Object.keys(RECIPES),count=Math.min(6,3+Math.floor(this.state.levelIndex/3));
    const byId=new Map(this.state.cars.map(c=>[c.id,c]));
    this.manifest=this.solution.map((id,i)=>{
      const recipe=keys[(i+Math.floor(i/count)+this.state.levelIndex)%count];
      Object.assign(byId.get(id),{recipe,color:RECIPES[recipe].color});
      return {id:i,recipe,featured:i===1};
    });
    this.total=this.manifest.length;this.fillOrders();
  }
  get busy(){return !!(this.running.length||this.walkers.length||this.state.bays.some(c=>c?.phase==='cooking'));}
  get canUndo(){return !this.busy&&this.undoStack.length>0;}
  fillOrders(){
    while(this.orders.length<3&&this.nextOrder<this.manifest.length){
      const order={...this.manifest[this.nextOrder++],truckId:null};this.orders.push(order);
      for(const [k,n] of Object.entries(RECIPES[order.recipe].needs))this.stock[k]+=n;
    }
    if(!this.orders.some(o=>o.id===this.preferred))this.preferred=null;
  }
  snapshot(){return JSON.stringify({state:this.state,orders:this.orders,nextOrder:this.nextOrder,stock:this.stock,completed:this.completed,delivered:this.delivered,preferred:this.preferred,featuredWon:this.featuredWon});}
  undo(){
    if(!this.canUndo)return false;
    const slots=this.state.bays.length;
    Object.assign(this,JSON.parse(this.undoStack.pop()));
    while(this.state.bays.length<slots)this.state.bays.push(null);
    this.running=[];this.walkers=[];this.puffs=[];this.celebrations=[];this.lastBoard=this.time;
    return true;
  }
  dispatch(id){
    // Super owns the physical route and reservation. Cooking also makes a
    // checkpoint unstable, so only retain snapshots taken at a settled state.
    const depth=this.undoStack.length,stable=!this.busy,result=super.dispatch(id);
    if(!stable)this.undoStack.length=depth;
    if(result.ok){
      const car=this.state.bays[result.slot];car.capacity=Object.values(RECIPES[car.recipe].needs).reduce((a,b)=>a+b,0);
      car.ingredients={};car.incoming={};car.orderId=null;
    }
    return result;
  }
  prioritize(orderId){
    if(!this.orders.some(o=>o.id===orderId))return false;
    this.preferred=orderId;return true;
  }
  claimOrders(){
    const orders=[...this.orders].sort((a,b)=>Number(b.id===this.preferred)-Number(a.id===this.preferred));
    for(const order of orders){
      if(order.truckId)continue;
      const car=this.state.bays.find(c=>c?.phase==='parked'&&c.orderId===null&&c.recipe===order.recipe);
      if(car){order.truckId=car.id;car.orderId=order.id;}
    }
  }
  readySuggestion(){
    // First prefer a currently requested dish. If its path is blocked, expose
    // the next exit from the constructive solution so the hint never lies.
    return this.state.cars.find(c=>canExit(this.state,c)&&this.orders.some(o=>!o.truckId&&o.recipe===c.recipe))
      ||this.state.cars.find(c=>canExit(this.state,c));
  }
  tick(dt){
    if(this.state.status==='won')return;
    dt=Math.max(0,Math.min(dt,.05))*ANIMATION_SPEED;this.time+=dt;
    for(const car of [...this.running]){
      car.elapsed+=dt;const p=Math.min(1,car.elapsed/car.duration);car.pose=pathPose(car.path,p);
      if(p===1){
        this.running=this.running.filter(c=>c!==car);
        if(car.phase==='leaving')this.state.bays[car.slot]=null;
        else {car.phase='parked';car.pose={...BAY(car.slot),angle:-2.1};}
      }
    }
    this.claimOrders();
    if(this.time-this.lastBoard>.19){
      const cars=this.state.bays.filter(c=>c?.phase==='parked'&&c.orderId!==null)
        .sort((a,b)=>Number(b.orderId===this.preferred)-Number(a.orderId===this.preferred));
      for(const car of cars){
        const key=Object.keys(RECIPES[car.recipe].needs).find(k=>(car.ingredients[k]||0)+(car.incoming[k]||0)<RECIPES[car.recipe].needs[k]&&this.stock[k]>0);
        if(!key)continue;
        this.lastBoard=this.time;this.stock[key]--;car.incoming[key]=(car.incoming[key]||0)+1;car.pending++;
        const start=PANTRY(key);
        this.walkers.push({key,car,elapsed:0,duration:.76,path:[start,{x:start.x,y:244},{x:car.pose.x-19,y:249},{x:car.pose.x-10,y:car.pose.y-10}]});
        break;
      }
    }
    for(const ingredient of [...this.walkers]){
      ingredient.elapsed+=dt;ingredient.pose=pathPose(ingredient.path,ingredient.elapsed/ingredient.duration);
      if(ingredient.elapsed>=ingredient.duration){
        const car=ingredient.car;car.incoming[ingredient.key]--;car.ingredients[ingredient.key]=(car.ingredients[ingredient.key]||0)+1;
        car.pending--;car.loaded++;this.delivered++;this.walkers=this.walkers.filter(i=>i!==ingredient);
      }
    }
    for(const car of this.state.bays.filter(Boolean)){
      if(car.phase==='parked'&&car.loaded===car.capacity){car.phase='cooking';car.cookElapsed=0;}
      if(car.phase==='cooking'){
        car.cookElapsed+=dt;
        if(car.cookElapsed>=1.15){
          const order=this.orders.find(o=>o.id===car.orderId);
          this.completed++;
          if(order.featured&&this.completed<=2)this.featuredWon=true;
          this.celebrations.push({x:car.pose.x,y:car.pose.y-52,age:0,recipe:car.recipe});
          this.orders=this.orders.filter(o=>o.id!==car.orderId);this.fillOrders();
          car.phase='leaving';car.elapsed=0;car.duration=1.05;
          car.path=smoothPath([car.pose,{x:car.pose.x+41,y:363},{x:655,y:363}]);this.running.push(car);
        }
      }
    }
    this.celebrations.forEach(p=>p.age+=dt);this.celebrations=this.celebrations.filter(p=>p.age<1.5);
    if(this.completed===this.total&&!this.busy&&this.state.bays.every(b=>!b))this.state.status='won';
    else if(this.state.bays.every(Boolean)&&!this.busy&&!this.state.bays.some(c=>c.orderId!==null))this.state.status='lost';
    else this.state.status='playing';
  }
}
