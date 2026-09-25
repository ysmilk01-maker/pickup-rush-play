import {stageProfile} from './campaign.js?v=41';
// Reproducible levels: changing a queue on retry would punish planning.
export function seededRandom(seed){
  let n=seed>>>0;
  return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}

// Each window uses at most four vehicles from a collision-valid exit order.
// Interleave their passengers instead of filling one car at a time. Because
// each color's demand equals its seats in that window, all slots can empty
// before the next window, even when two vehicles share a color.
export function passengerQueue(cars,level,capacity,legacy=false){
  const random=seededRandom(7301+level*104729),queue=[];
  const profile=stageProfile(level);
  let offset=0,wave=0;
  while(offset<cars.length){
    const width=legacy?(level<3?2:level<12?3:level<24?(wave%3===0?4:3):4)
      :Math.floor((wave+1)*profile.pressure+1e-9)-Math.floor(wave*profile.pressure+1e-9);
    const group=cars.slice(offset,offset+width),remaining=new Map();
    for(const car of group)remaining.set(car.color,(remaining.get(car.color)||0)+capacity[car.type]);
    let previous=null,first=true;
    while(remaining.size){
      const colors=[...remaining.keys()],other=colors.filter(c=>c!==previous),choices=other.length?other:colors;
      const color=first&&offset===0&&level===0?group[0].color:choices[Math.floor(random()*choices.length)];
      const amount=Math.min(remaining.get(color),1+Math.floor(random()*(legacy?3:profile.maxBatch)));
      queue.push(...Array(amount).fill(color));
      const rest=remaining.get(color)-amount;if(rest)remaining.set(color,rest);else remaining.delete(color);
      previous=color;first=false;
    }
    offset+=group.length;wave++;
  }
  return queue;
}
