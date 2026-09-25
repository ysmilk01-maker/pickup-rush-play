import { vehicleModel } from './appearance.js?v=49';

export const GROUND_SCALE = .83;
export const LOT = { left: 24, right: 576, top: 432, bottom: 913 };
export const isFreeform = car => Number.isFinite(car.x) && Number.isFinite(car.y);
export function footprint(car, margin = 0) {
  const model=car.barrier?car:vehicleModel(car),a=car.angle;
  return { x:car.x,y:car.y/GROUND_SCALE,
    u:{x:Math.cos(a),y:Math.sin(a)},v:{x:-Math.sin(a),y:Math.cos(a)},
    halfLength:model.length/2+margin,halfWidth:model.width/2+margin };
}
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const radius=(box,axis)=>Math.abs(dot(box.u,axis))*box.halfLength+Math.abs(dot(box.v,axis))*box.halfWidth;

// Continuous separating-axis intersection. The footprint and the rendered car
// use the same model dimensions, angle and ground projection.
export function collisionInterval(car,other,margin=0) {
  const a=footprint(car,margin),b=footprint(other,margin),delta={x:b.x-a.x,y:b.y-a.y};
  let entry=-Infinity,exit=Infinity;
  for(const axis of [a.u,a.v,b.u,b.v]) {
    const separation=dot(delta,axis),extent=radius(a,axis)+radius(b,axis),speed=dot(a.u,axis);
    if(Math.abs(speed)<1e-9){if(Math.abs(separation)>extent)return null;continue;}
    const t1=(separation-extent)/speed,t2=(separation+extent)/speed;
    entry=Math.max(entry,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));
    if(entry>exit)return null;
  }
  return {entry,exit};
}
export function overlaps(car,other,margin=0) {const hit=collisionInterval(car,other,margin);return !!hit&&hit.entry<=0&&hit.exit>=0;}
export function blockers(car,cars) {
  return cars.filter(other=>other.id!==car.id).map(other=>({other,hit:collisionInterval(car,other,1.5)}))
    .filter(({hit})=>hit&&hit.exit>0&&hit.entry<1400).sort((a,b)=>a.hit.entry-b.hit.entry);
}
export function bounds(car) {
  const b=footprint(car),rx=radius(b,{x:1,y:0}),ry=radius(b,{x:0,y:1})*GROUND_SCALE;
  return {left:car.x-rx,right:car.x+rx,top:car.y-ry,bottom:car.y+ry};
}
