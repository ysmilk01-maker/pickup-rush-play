import { assignModels } from './appearance.js?v=16';
import { bounds, blockers, overlaps, LOT } from './geometry.js?v=16';

const ANGLES={R:Math.PI/4,L:-3*Math.PI/4,U:-Math.PI/4,D:3*Math.PI/4,NE:0,SW:Math.PI,NW:-Math.PI/2,SE:Math.PI/2};
const directions=Object.keys(ANGLES);
function randomFrom(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function inShape(car,variant) {
  const b=bounds(car),x=car.x,y=car.y;
  if(b.left<LOT.left+10||b.right>LOT.right-10||b.top<LOT.top+27||b.bottom>LOT.bottom-12)return false;
  // Irregular shoulders, different recesses and small open passageways.
  if(variant===0)return !(x<120&&y<535)&&!(x>470&&y>850)&&!(x>270&&x<312&&y>655&&y<770);
  if(variant===1)return !(x>455&&y<560)&&!(x<165&&y>830)&&!(x<290&&x>248&&y>535&&y<650);
  if(variant===2)return !(x<155&&y<565)&&!(x>460&&y>830)&&!(y>667&&y<708&&x>285);
  if(variant===3)return !(x>450&&y<550)&&!(x<115&&y>860)&&!(x>255&&x<298&&y>740);
  if(variant===4)return !(x<135&&y<530)&&!(x>465&&y>875)&&!(y>620&&y<659&&x<270);
  return !(x>435&&y<530)&&!(x<145&&y>855)&&!(x>345&&x<385&&y>620&&y<750);
}

export function scatterVehicles({seed,count,prefix,colorFor,types}) {
  let best=0;
  for(let attempt=0;attempt<24;attempt++){
    const random=randomFrom(seed+attempt*7919),cars=[],placed=[];
    for(const [type,amount] of [['bus',count===48?8:6],['van',count===48?24:20],['taxi',count===48?16:14]]){
      for(let j=0;j<amount;j++){
        const i=cars.length,dir=directions[(i+seed)%8];
        cars.push({id:`${prefix}${type[0]}${i}`,type,color:colorFor(i),len:types[type].len,dir,r:4,c:4,scale:count===48?.9:1,
          angle:ANGLES[dir]+(random()-.5)*.4});
      }
    }
    assignModels(cars);
    for(const car of cars){
      let chosen=null;
      for(let trial=0;trial<1800;trial++){
        const dir=placed.length<8?car.dir:directions[Math.floor(random()*8)];
        const candidate={...car,dir,angle:ANGLES[dir]+(random()-.5)*.4,x:52+random()*496,y:477+random()*400};
        if(!inShape(candidate,seed%6)||placed.some(other=>overlaps(candidate,other,3)))continue;
        // Reverse construction: every newly added car can leave before the
        // existing cars. Reversing insertion order therefore gives a solution.
        if(blockers(candidate,placed).length)continue;
        chosen=candidate;break;
      }
      if(!chosen)break;
      placed.push(chosen);
    }
    best=Math.max(best,placed.length);
    if(placed.length===count)return placed.reverse();
  }
  throw new Error(`Cannot construct freeform stage ${prefix} (${best}/${count})`);
}
