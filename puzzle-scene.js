import {vehicleModel} from './appearance.js?v=50';
import {GROUND_SCALE} from './geometry.js?v=50';

export function keyBadge(scene,x,y,label){
 scene.ellipse(x,y,11,11,'#172c3e');scene.ellipse(x-3,y-2,3.5,3.5,'#ffdb79');scene.ellipse(x-3,y-2,1.4,1.4,'#172c3e');
 const c=scene.c;c.strokeStyle='#ffdb79';c.lineWidth=2.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+6,y+5);c.moveTo(x+4,y+3);c.lineTo(x+2,y+5);c.stroke();
 if(label)scene.text(label,x+13,y,9,'#ffe7aa');
}
export function drawGates(scene,traffic){
 scene.gateFrames??=new Map();
 for(const g of traffic.state.puzzle?.gates||[]){
  const signature=`${traffic.state.levelIndex}:${g.id}`;let frame=scene.gateFrames.get(signature);
  if(!frame||frame.open!==g.open){frame={open:g.open,at:traffic.time};scene.gateFrames.set(signature,frame);}
  const raw=scene.reduceMotion?1:Math.min(1,Math.max(0,(traffic.time-frame.at)/.22));
  const lift=g.open?1-(1-raw)**3:0,ca=Math.cos(g.angle),sa=Math.sin(g.angle);
  const p=(u,v=0,z=0)=>({x:g.x+u*ca-v*sa,y:g.y+(u*sa+v*ca)*GROUND_SCALE-z});
  for(const u of [-g.length/2,g.length/2]){const q=p(u);scene.ellipse(q.x,q.y+3,7,4,'#13273677');scene.rect(q.x-4,q.y-22,8,25,3,'#315163','#a0b9b7');scene.ellipse(q.x,q.y-23,3,2,g.open?'#91eec2':'#ffcb77');}
  const arm=(u,v)=>p(-g.length/2+(u+g.length/2)*(1-lift*.91),v,16+lift*(u+g.length/2)*.82);
  scene.polygon([arm(-29,-4),arm(29,-4),arm(29,4),arm(-29,4)],g.open?'#a5c6be':'#f8d7a0','#263c4c',1.5);
  for(let u=-27;u<27;u+=14)scene.polygon([arm(u,-3),arm(u+7,-3),arm(u+11,3),arm(u+4,3)],g.open?'#448d79':'#cf6c68');
  const tag=p(0,0,34);scene.rect(tag.x-13,tag.y-9,26,18,6,'#203c4c','#dcb978');scene.text(g.open?'✓':g.id.at(-1),tag.x,tag.y,12,g.open?'#9af0c5':'#ffe1a0');
 }
}
export function drawBlockage(scene,traffic,selection){
 if(!selection?.blocker||selection.until<=traffic.time)return;
 const car=traffic.state.cars.find(c=>c.id===selection.id);if(!car)return;
 const {other,hit}=selection.blocker,c=scene.c;
 const distance=Math.max(0,hit.entry),length=vehicleModel(car).length/2;
 const start={x:car.x+Math.cos(car.angle)*length,y:car.y+Math.sin(car.angle)*length*GROUND_SCALE-7};
 const end={x:start.x+Math.cos(car.angle)*distance,y:start.y+Math.sin(car.angle)*distance*GROUND_SCALE};
 c.save();c.strokeStyle='#ffd4a0';c.lineWidth=3;c.setLineDash([5,5]);c.beginPath();c.moveTo(start.x,start.y);c.lineTo(end.x,end.y);c.stroke();c.setLineDash([]);
 scene.ellipse(end.x,end.y,8,8,'#f06e66');scene.text('×',end.x,end.y,17,'#fff9e4');
 const model=other.barrier?other:vehicleModel(other);
 c.translate(other.x,other.y-6);c.scale(1,GROUND_SCALE);c.rotate(other.angle);c.strokeStyle='#ffcc82';c.lineWidth=3;c.beginPath();c.roundRect(-model.length/2-5,-model.width/2-5,model.length+10,model.width+10,8);c.stroke();c.restore();
}
