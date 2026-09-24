import { createGame, canExit, COLORS, VEHICLE_TYPES } from './game.js?v=25';
import { assignModels, makePassenger } from './appearance.js?v=25';
import { isFreeform, bounds, LOT, GROUND_SCALE } from './geometry.js?v=25';
import { passengerQueue } from './demand.js?v=25';

export const CAPACITY = { taxi: 4, van: 6, bus: 10 };
export const ANIMATION_SPEED = 1.5;
export const DIRECTIONS = {R:[1,0],L:[-1,0],U:[0,-1],D:[0,1],NE:[1,-1],NW:[-1,-1],SE:[1,1],SW:[-1,1]};
export const PROJECT = (x,y) => ({x:300+(x-y)*30.5,y:682+(x+y)*28});
export const BAY = i => ({x:65+i*76,y:292});
export const QUEUE = i => i < 18 ? {x:136+i*21,y:189} : {x:493,y:189-(i-17)*16};
export function carPose(car,state) {
  if(isFreeform(car))return {x:car.x,y:car.y,angle:car.angle};
  const x=car.c+(car.dir==='L'||car.dir==='R'?(car.len-1)/2:0)-(state.cols-1)/2;
  const y=car.r+(car.dir==='U'||car.dir==='D'?(car.len-1)/2:0)-(state.rows-1)/2;
  const p=PROJECT(x,y), d=DIRECTIONS[car.dir];
  return {...p,angle:Math.atan2((d[0]+d[1])*28,(d[0]-d[1])*30.5)};
}
export function smoothPath(points) {
  const result=[points[0]];
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];
    const l1=Math.hypot(b.x-a.x,b.y-a.y),l2=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(22,l1*.2,l2*.2);
    const enter={x:b.x+(a.x-b.x)*r/l1,y:b.y+(a.y-b.y)*r/l1},exit={x:b.x+(c.x-b.x)*r/l2,y:b.y+(c.y-b.y)*r/l2};
    result.push(enter);
    for(let k=1;k<=8;k++){const t=k/8;result.push({x:(1-t)**2*enter.x+2*(1-t)*t*b.x+t*t*exit.x,y:(1-t)**2*enter.y+2*(1-t)*t*b.y+t*t*exit.y});}
  }result.push(points.at(-1));return result;
}
export function pathPose(path,t) {
  const distances=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));
  let length=distances.reduce((a,b)=>a+b,0)*Math.min(1,t);
  for(let i=0;i<distances.length;i++) {
    if(length<=distances[i]||i===distances.length-1) {
      const a=path[i],b=path[i+1],f=distances[i]?Math.min(1,length/distances[i]):1;
      return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,angle:Math.atan2((b.y-a.y)/GROUND_SCALE,b.x-a.x)};
    }
    length-=distances[i];
  }
  return {...path[0],angle:0};
}
export function routeFor(car,state,bayIndex) {
  const p=carPose(car,state),dx=Math.cos(p.angle),dy=Math.sin(p.angle)*GROUND_SCALE;
  // Leave along the real arrow, then travel around the outside of the lot.
  let distance=0,q=p;
  while(distance<800) {
    distance+=4;q={x:p.x+dx*distance,y:p.y+dy*distance};
    if(isFreeform(car)){
      const box=bounds({...car,x:q.x,y:q.y});
      if(box.right<LOT.left||box.left>LOT.right||box.bottom<LOT.top||box.top>LOT.bottom)break;
    }else if(Math.abs((q.x-300)/30.5)+Math.abs((q.y-682)/28)>state.rows+1.6)break;
  }
  const side=q.x<300?18:582;
  const path=[p,q];
  if(q.y>390) path.push({x:side,y:q.y},{x:side,y:363});
  else path.push({x:q.x,y:363});
  const bay=BAY(bayIndex);
  path.push({x:bay.x+41,y:363},bay);
  return smoothPath(path);
}
export class Traffic {
  constructor(level=0,legacy=false) {
    this.state=createGame(level,legacy);this.time=0;this.running=[];this.walkers=[];this.puffs=[];this.delivered=0;this.total=0;this.lastBoard=-1;this.undoStack=[];
    if(this.state.cars.some(car=>!car.model))assignModels(this.state.cars);
    const byId=new Map(this.state.cars.map(car=>[car.id,car]));
    this.state.queue=passengerQueue(this.solution.map(id=>byId.get(id)),this.state.levelIndex,CAPACITY,legacy);
    this.demandVersion=legacy?2:3;
    this.total=this.state.queue.length;this.queueVisual=0;this.queueConsumed=0;
    this.state.people=this.state.queue.map((_,id)=>makePassenger(id));
  }
  get solution(){return this._solution || (this._solution=this.state.cars.length?this.findSolution():[]);}
  findSolution(){const s={...this.state,cars:[...this.state.cars]},ids=[];while(s.cars.length){const c=s.cars.find(c=>canExit(s,c));if(!c)throw Error('Locked level');ids.push(c.id);s.cars=s.cars.filter(a=>a.id!==c.id);}return ids;}
  dispatch(id) {
    if(this.state.status==='won')return {ok:false,reason:'won'};
    const car=this.state.cars.find(c=>c.id===id);if(!car)return {ok:false,reason:'missing'};
    if(!canExit(this.state,car))return {ok:false,reason:'blocked'};
    const slot=this.state.bays.findIndex(b=>!b);if(slot<0)return {ok:false,reason:'full'};
    if(!this.running.length&&!this.walkers.length)this.undoStack.push(this.snapshot());
    this.state.status='playing';this.state.cars=this.state.cars.filter(c=>c.id!==id);this.state.moves++;
    const vehicle={...car,slot,capacity:CAPACITY[car.type],loaded:0,pending:0,passengers:[],phase:'driving',elapsed:0,path:routeFor(car,this.state,slot)};
    vehicle.duration=vehicle.path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-vehicle.path[i].x,p.y-vehicle.path[i].y),0)/390;
    vehicle.pose=carPose(car,this.state);this.state.bays[slot]=vehicle;this.running.push(vehicle);
    return {ok:true,slot};
  }
  snapshot(){return JSON.stringify({state:this.state,delivered:this.delivered,queueConsumed:this.queueConsumed});}
  undo(){if(this.running.length||this.walkers.length||!this.undoStack.length)return false;const bays=this.state.bays.length;Object.assign(this,JSON.parse(this.undoStack.pop()));while(this.state.bays.length<bays)this.state.bays.push(null);this.queueVisual=this.queueConsumed;return true;}
  addBay(){if(this.state.bays.length>=7||this.state.status==='won')return false;this.state.bays.push(null);this.state.status='playing';return true;}
  sortQueue(color){
    const people=this.state.queue.map((color,i)=>({color,person:this.state.people[i]}));
    const sorted=[...people.filter(p=>p.color===color),...people.filter(p=>p.color!==color)];
    this.state.queue=sorted.map(p=>p.color);this.state.people=sorted.map(p=>p.person);
  }
  tick(dt){
    dt=Math.max(0,Math.min(dt,.05))*ANIMATION_SPEED;this.time+=dt;
    this.queueVisual+=(this.queueConsumed-this.queueVisual)*Math.min(1,dt*9);
    for(const car of [...this.running]){
      car.elapsed+=dt;const t=Math.min(1,car.elapsed/car.duration);car.pose=pathPose(car.path,t);
      if(Math.random()<dt*25)this.puffs.push({x:car.pose.x-Math.cos(car.pose.angle)*30,y:car.pose.y-Math.sin(car.pose.angle)*30,age:0});
      if(t===1){this.running=this.running.filter(c=>c!==car);if(car.phase==='leaving'){this.state.bays[car.slot]=null;}else{car.phase='parked';car.pose={...BAY(car.slot),angle:-2.1};}}
    }
    if(this.time-this.lastBoard>.13&&this.state.queue.length){
      const car=this.state.bays.find(c=>c?.phase==='parked'&&c.color===this.state.queue[0]&&c.loaded+c.pending<c.capacity);
      if(car){this.lastBoard=this.time;const color=this.state.queue.shift(),person=this.state.people.shift();this.queueConsumed++;car.pending++;
        this.walkers.push({color,person,car,elapsed:0,duration:.6,path:[QUEUE(0),{x:136,y:221},{x:car.pose.x-20,y:221},{x:car.pose.x-11,y:car.pose.y-10}]});}
    }
    for(const p of [...this.walkers]){p.elapsed+=dt;p.pose=pathPose(p.path,p.elapsed/p.duration);if(p.elapsed>=p.duration){p.car.pending--;p.car.loaded++;p.car.passengers.push(p.person);this.delivered++;this.walkers=this.walkers.filter(w=>w!==p);}}
    for(const car of this.state.bays.filter(Boolean)){
      if(car.phase==='parked'&&car.loaded===car.capacity){car.phase='leaving';car.elapsed=0;car.duration=1.05;car.path=smoothPath([car.pose,{x:car.pose.x+41,y:363},{x:655,y:363}]);this.running.push(car);}
    }
    this.puffs.forEach(p=>p.age+=dt);this.puffs=this.puffs.filter(p=>p.age<.5);
    if(!this.state.cars.length&&!this.state.queue.length&&!this.running.length&&!this.walkers.length&&this.state.bays.every(b=>!b))this.state.status='won';
    else if(this.state.bays.every(Boolean)&&!this.running.length&&!this.walkers.length&&!this.state.bays.some(c=>c.color===this.state.queue[0]))this.state.status='lost';
  }
}
