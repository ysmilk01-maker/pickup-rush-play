import {BAY} from './traffic.js?v=50';
import {COLORS} from './game.js?v=50';
import {districtLabel} from './district-scene.js?v=50';

const line=(s,points,color,width=1)=>{const c=s.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
const poly=(s,points,color)=>s.polygon(points.map(([x,y])=>({x,y})),color);
function drain(s,x,y,w=36){s.rect(x,y,w,7,2,'#20303bd0','#84929a50');for(let i=4;i<w-2;i+=5)line(s,[[x+i,y+1],[x+i-2,y+6]],'#9aa4a260');}
function shelter(s,p,index){
 const c=s.c;
 // Glass back wall and a slim metal roof sit behind the waiting passengers.
 s.rect(108,143,405,64,4,'#a1d1d848');
 for(let i=0;i<6;i++){
  const x=117+i*63,glass=c.createLinearGradient(x,144,x+52,198);glass.addColorStop(0,'#f1ffffaa');glass.addColorStop(1,'#99ced5aa');s.rect(x,145,56,53,2,glass,'#ffffffaa');
  poly(s,[[x+30,146],[x+44,146],[x+12,198],[x+3,198]],'#d5f3f015');
 }
 for(const x of [111,306,509]){s.rect(x+3,147,4,61,1,'#5b8e9970');s.rect(x,144,4,61,1,'#e9f7ef');s.rect(x-3,202,10,4,1,'#8cafb4');}
 for(const x of [154,333]){s.rect(x,191,116,5,2,'#b6a180');s.rect(x+7,196,3,11,1,'#8ba3a6');s.rect(x+105,196,3,11,1,'#8ba3a6');}
 // The canopy is shallow so neither the queue nor the district landmark is hidden.
 poly(s,[[101,139],[126,120],[497,120],[524,139]],p.building);
 for(let i=0;i<12;i++)line(s,[[131+i*31,121],[113+i*34,137]],'#b9cfce28');
 poly(s,[[101,139],[524,139],[524,148],[101,148]],'#78aebb');line(s,[[105,140],[520,140]],p.edge,2);
 line(s,[[123,147],[498,147]],'#ffdf9aa0',2);
 s.rect(236,124,149,17,7,'#fff9e5');s.text(districtLabel(index)+' 정류장',310,133,11,'#305b6a');
 // Paving, tactile strip and curb form a continuous walking route.
 s.rect(12,209,576,40,4,'#e7e4d5');s.rect(12,210,576,2,0,'#fff8e7');
 for(let x=24;x<583;x+=28)line(s,[[x,212],[x-12,243]],'#333f481c');
 s.rect(16,241,568,6,1,'#c9af6c');for(let x=20;x<582;x+=8)s.ellipse(x,244,1.1,1.1,'#826c45');
 s.rect(12,247,576,6,1,'#99b6b8');line(s,[[13,248],[586,248]],'#dde1c48a');
 // Ticket machine and posted route diagram beside the waiting area.
 s.rect(552,166,25,38,3,'#82acbc','#859b9e');s.rect(556,172,17,14,2,'#9dc8c6');s.rect(560,190,9,3,1,'#101d29');
 s.rect(534,150,3,54,1,'#728c94');s.rect(525,150,20,17,3,'#c3dac9');s.text('BUS',535,159,7,'#284354');
 drain(s,18,236,67);drain(s,531,237,49);
 // Recessed asphalt forecourt and concrete apron.
 const platform=c.createLinearGradient(0,252,0,337);platform.addColorStop(0,'#d2e3e8');platform.addColorStop(1,'#b2cad6');s.rect(12,253,576,85,5,platform);
 s.rect(12,334,576,5,1,'#91acb9');line(s,[[14,334],[586,334]],'#b8c7c486');
 for(let i=0;i<7;i++){const b=BAY(i);line(s,[[b.x-29,316],[b.x-40,264],[b.x-25,264]],'#dce6d374',1.5);line(s,[[b.x+28,313],[b.x+15,260]],'#dce6d357',1.5);}
}
function lot(s,p){
 // One uninterrupted ground plane. No tray, curb frame, tiles or patch panels.
 const floor=s.c.createLinearGradient(0,392,0,1080);
 floor.addColorStop(0,p.lotTop);floor.addColorStop(1,p.lotBottom);
 s.rect(0,392,600,688,0,floor);
}

export function stationEnvironment(s,p,index){
 const key=`${index}:${s.canvas.width}`;
 if(s.stationCache?.key!==key){
  const canvas=document.createElement('canvas');canvas.width=s.canvas.width;canvas.height=s.canvas.height;
  const layer=Object.create(s);layer.c=canvas.getContext('2d');layer.c.setTransform(canvas.width/600,0,0,canvas.height/1080,0,0);
  shelter(layer,p,index);lot(layer,p,index);s.stationCache={key,canvas};
 }
 s.c.drawImage(s.stationCache.canvas,0,0,600,1080);
}
export function stationBays(s,t){
 const c=s.c;
 for(let i=0;i<7;i++){
  const b=BAY(i),open=i<t.state.bays.length,car=t.state.bays[i],color=car?COLORS[car.color].hex:'#c8ddc7';
  if(open){
   s.rect(b.x-23,321,46,12,3,'#f7fff3');s.text(String(i+1).padStart(2,'0'),b.x,327,10,'#3c6571');
   s.ellipse(b.x-18,327,2,2,car?color:'#8fd7ad');
   if(car){const g=c.createRadialGradient(b.x,302,0,b.x,302,36);g.addColorStop(0,color+'28');g.addColorStop(1,color+'00');s.ellipse(b.x,302,36,24,g);}
  }else{
   s.ellipse(b.x+3,307,26,6,'#69899633');
   for(const x of [b.x-18,b.x+18]){line(s,[[x,284],[x-4,309]],'#bdc8bc',3);line(s,[[x,285],[x+6,309]],'#536a74',3);}
   s.rect(b.x-26,278,52,13,2,'#ffe3aa');
   for(let n=0;n<5;n++)poly(s,[[b.x-25+n*11,279],[b.x-20+n*11,279],[b.x-25+n*11,290],[b.x-30+n*11,290]],'#d79e64');
   s.rect(b.x-10,270,20,18,4,'#fff4d7','#e0cf9b');s.text('+',b.x,279,19,'#966035');
   s.rect(b.x-27,320,54,14,3,'#fff9e9');s.text('광고 +1',b.x,328,9,'#785b3f');
  }
 }
}
