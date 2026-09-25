import {QUEUE,pathPose} from './traffic.js?v=55';

export function cutPose(t,person,index,reduced){
 const q=t.state.queueCut;
 if(q?.status!=='entering'||reduced)return null;
 const to=QUEUE(index),guest=q.ids.indexOf(person.id),f=Math.min(1,q.elapsed/.9);
 if(guest>=0){
  const p=Math.max(0,Math.min(1,(f-guest*.06)/(1-guest*.06)));
  // Guests run along the sidewalk, then slip into the head of the queue.
  return {...pathPose([{x:620+guest*20,y:229},{x:to.x,y:229},to],p),walking:true};
 }
 const old=q.originOrder.indexOf(person.id),from=QUEUE(Math.min(old,24));
 return {x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f,walking:true};
}
export function cutBadge(s,t,person,x,y){
 const q=t.state.queueCut;
 if(!q||q.status==='missed'||!q.ids.includes(person?.id))return;
 s.ellipse(x+8,y-39,7,7,'#ffebaf');s.text('!',x+8,y-38,11,'#99552f');
}
