import {BAY} from './traffic.js?v=41';
import {COLORS} from './game.js?v=41';
import {districtLabel} from './district-scene.js?v=41';

const line=(s,points,color,width=1)=>{const c=s.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
const poly=(s,points,color)=>s.polygon(points.map(([x,y])=>({x,y})),color);
function planter(s,x,y,p,flowers=false){
 s.ellipse(x+4,y+6,20,6,'#0c172849');s.rect(x-17,y-8,34,14,4,'#425254');s.rect(x-19,y-11,38,5,2,p.edge);
 for(let i=0;i<6;i++){const px=x-13+i*5,py=y-13-(i%3)*3;s.ellipse(px,py,7,5,i%2?'#668579':'#3e685e');if(flowers)s.ellipse(px,py-3,2,2,p.accent);}
}
function drain(s,x,y,w=36){s.rect(x,y,w,7,2,'#20303bd0','#84929a50');for(let i=4;i<w-2;i+=5)line(s,[[x+i,y+1],[x+i-2,y+6]],'#9aa4a260');}
function shelter(s,p,index){
 const c=s.c;
 // Glass back wall and a slim metal roof sit behind the waiting passengers.
 s.rect(108,143,405,64,4,'#071d2a48');
 for(let i=0;i<6;i++){
  const x=117+i*63,glass=c.createLinearGradient(x,144,x+52,198);glass.addColorStop(0,'#9acbd537');glass.addColorStop(1,'#24455060');s.rect(x,145,56,53,2,glass,'#99b9bc55');
  poly(s,[[x+30,146],[x+44,146],[x+12,198],[x+3,198]],'#d5f3f015');
 }
 for(const x of [111,306,509]){s.rect(x+3,147,4,61,1,'#0c202b70');s.rect(x,144,4,61,1,'#a7b8b8');s.rect(x-3,202,10,4,1,'#6f898f');}
 for(const x of [154,333]){s.rect(x,191,116,5,2,'#b6a180');s.rect(x+7,196,3,11,1,'#8ba3a6');s.rect(x+105,196,3,11,1,'#8ba3a6');}
 // The canopy is shallow so neither the queue nor the district landmark is hidden.
 poly(s,[[101,139],[126,120],[497,120],[524,139]],p.building);
 for(let i=0;i<12;i++)line(s,[[131+i*31,121],[113+i*34,137]],'#b9cfce28');
 poly(s,[[101,139],[524,139],[524,148],[101,148]],'#142f3d');line(s,[[105,140],[520,140]],p.edge,2);
 line(s,[[123,147],[498,147]],'#ffdf9aa0',2);
 s.rect(236,124,149,17,3,'#132331');s.text(districtLabel(index)+' 정류장',310,133,11,'#ecf0dd');
 // Paving, tactile strip and curb form a continuous walking route.
 s.rect(12,209,576,40,4,'#8a8b85');s.rect(12,210,576,2,0,'#c9c6ad');
 for(let x=24;x<583;x+=28)line(s,[[x,212],[x-12,243]],'#333f481c');
 s.rect(16,241,568,6,1,'#c9af6c');for(let x=20;x<582;x+=8)s.ellipse(x,244,1.1,1.1,'#826c45');
 s.rect(12,247,576,6,1,'#3d4e54');line(s,[[13,248],[586,248]],'#dde1c48a');
 // Ticket machine and posted route diagram beside the waiting area.
 s.rect(552,166,25,38,3,'#263e4e','#859b9e');s.rect(556,172,17,14,2,'#9dc8c6');s.rect(560,190,9,3,1,'#101d29');
 s.rect(534,150,3,54,1,'#728c94');s.rect(525,150,20,17,3,'#c3dac9');s.text('BUS',535,159,7,'#284354');
 drain(s,18,236,67);drain(s,531,237,49);
 // Recessed asphalt forecourt and concrete apron.
 const platform=c.createLinearGradient(0,252,0,337);platform.addColorStop(0,'#51616a');platform.addColorStop(1,'#34434e');s.rect(12,253,576,85,5,platform);
 s.rect(12,334,576,5,1,'#202f3c');line(s,[[14,334],[586,334]],'#b8c7c486');
 for(let i=0;i<7;i++){const b=BAY(i);line(s,[[b.x-29,316],[b.x-40,264],[b.x-25,264]],'#dce6d374',1.5);line(s,[[b.x+28,313],[b.x+15,260]],'#dce6d357',1.5);}
}
function lot(s,p,index){
 const c=s.c;
 // Raised curb and deep asphalt replace the old flat rounded game tray.
 s.rect(10,403,580,525,20,'#15263280');s.rect(12,399,576,521,17,'#879590');
 const floor=c.createLinearGradient(40,421,540,919);floor.addColorStop(0,p.lotBottom);floor.addColorStop(.45,p.road);floor.addColorStop(1,p.lotBottom);
 s.rect(21,411,558,501,11,floor);line(s,[[27,413],[573,413]],'#e0e4cd90',2);
 // Curb blocks are confined to the perimeter, never a grid under the cars.
 for(let y=436;y<899;y+=34){s.rect(13,y,6,22,1,y%68<34?'#e3d8aa':'#535f64');s.rect(582,y,6,22,1,y%68<34?'#e3d8aa':'#535f64');}
 c.save();c.beginPath();c.roundRect(22,415,556,496,10);c.clip();
 // Deterministic grain and broad resurfacing patches, baked into a cached layer.
 let seed=1831+index*211;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<1100;i++){const x=22+rand()*556,y=417+rand()*491,light=rand()>.55;c.fillStyle=light?'#e3e0ce0c':'#0b142619';c.fillRect(x,y,rand()*1.8+.4,.7);}
 c.globalAlpha=.14;
 poly(s,[[42,490],[176,470],[229,612],[85,644]],'#a3b2b6');poly(s,[[429,735],[561,760],[570,879],[407,851]],'#0e2132');c.globalAlpha=1;
 line(s,[[25,683],[91,674],[133,696],[170,687]],'#0c1b2938',1.2);line(s,[[570,550],[513,575],[502,614],[480,633]],'#d5d0b81a');
 // Faded tire sweeps are road wear, not directions or game cells.
 for(let n=0;n<2;n++){c.beginPath();c.ellipse(299,732,218+n*8,162+n*8,-.3,.3,2.4);c.strokeStyle='#111d2815';c.lineWidth=3;c.stroke();}
 for(const [x,y] of [[64,861],[529,463]]){s.ellipse(x,y,13,7,'#1c2b3870');c.strokeStyle='#bac7bc30';c.lineWidth=1;c.beginPath();c.ellipse(x,y,11,5,0,0,Math.PI*2);c.stroke();for(let j=-6;j<=6;j+=4)line(s,[[x+j,y-3],[x+j,y+3]],'#aab9b333');}
 if(['river','harbor','bridge'].includes(p.motif)){
  for(const [x,y,r] of [[85,473,50],[514,849,56]]){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#a8dbe523');g.addColorStop(1,'#88cddd00');s.ellipse(x,y,r,r*.35,g);line(s,[[x-r*.7,y],[x+r*.7,y-2]],'#c9f0e521');}
 }
 if(['sakura','forest','hills','festival'].includes(p.motif))for(let i=0;i<24;i++){const x=i%2?29+rand()*29:547+rand()*27,y=432+rand()*466;s.ellipse(x,y,2.5,1.3,p.motif==='sakura'?'#edbbca77':p.motif==='forest'?'#93a36a77':'#d6b88a55');}
 if(['galaxy','bridge','terminal'].includes(p.motif)){line(s,[[26,503],[26,895],[95,905]],p.accent+'75',2);line(s,[[574,461],[574,888]],p.accent+'75',2);}
 // Quiet oversized surface identity, low contrast so arrows remain dominant.
 c.save();c.translate(301,827);c.rotate(-.08);s.text(String(Math.floor(index/10)+1).padStart(2,'0'),0,0,108,'#dbe4de08');c.restore();
 c.restore();
 // Street furniture stays outside the playable footprint (x24..576,y432..913).
 drain(s,36,914,114);drain(s,450,914,114);
 if(['lantern','sakura','forest','hills'].includes(p.motif)){planter(s,84,407,p,p.motif==='sakura');planter(s,516,407,p,p.motif==='forest');}
 if(['harbor','river'].includes(p.motif))for(const x of [72,139,461,528]){s.ellipse(x+2,408,8,3,'#14253588');s.rect(x-3,391,6,17,2,'#8cabb7');s.rect(x-4,393,8,3,1,p.accent);}
 if(['galaxy','bridge','terminal'].includes(p.motif)){s.rect(78,400,86,9,2,p.building);line(s,[[81,404],[161,404]],p.accent,2);s.rect(436,400,86,9,2,p.building);line(s,[[439,404],[519,404]],p.accent,2);}
 if(p.motif==='festival')for(let i=0;i<12;i++){const x=85+i*39;line(s,[[x,399],[x+29,399]],'#d6c1a7',1);poly(s,[[x,399],[x+14,408],[x+28,399]],i%2?'#b489a4':'#cfb578');}
 for(const x of [17,583])for(const y of [449,887]){s.rect(x-4,y,8,13,2,'#223846');s.rect(x-3,y+1,6,4,1,p.accent);const glow=c.createRadialGradient(x,y+4,0,x,y+4,35);glow.addColorStop(0,p.accent+'30');glow.addColorStop(1,p.accent+'00');s.ellipse(x,y+4,35,27,glow);}
 // District streets extend down both sides, clear of every vehicle footprint.
 for(const x of [2,598]){
  if(['lantern','sakura','hills','forest'].includes(p.motif)){
   for(const y of [520,690,830]){s.rect(x-9,y,18,24,3,'#384d49');s.rect(x-10,y,20,4,1,p.edge);for(let n=0;n<5;n++){const px=x+(n%2?5:-5),py=y-3-n*4;s.ellipse(px,py,9,7,p.motif==='sakura'?(n%2?'#bf839b':'#d7a7b4'):n%2?'#486f5a':'#70917c');}}
  }else if(['river','harbor'].includes(p.motif)){
   s.rect(x-3,490,6,357,2,'#466b7a');for(const y of [503,613,723,833]){s.ellipse(x,y,10,4,'#91b4bb');s.rect(x-2,y,4,35,1,'#c1cecd');}line(s,[[x,505],[x,835]],'#a3c6c2',2);
  }else if(p.motif==='festival'){
   for(let n=0;n<8;n++){const y=498+n*49;s.ellipse(x,y,8,10,n%2?'#d0a2bb':'#d4bb8a');s.rect(x-2,y+10,4,5,1,'#977761');}
  }else{
   for(let n=0;n<6;n++){const y=511+n*61;s.rect(x-7,y,14,36,3,'#26394c');s.rect(x-3,y+3,6,26,2,n%2?p.edge:p.accent);}
  }
 }
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
   s.rect(b.x-23,321,46,12,3,'#172e3c');s.text(String(i+1).padStart(2,'0'),b.x,327,10,'#dde6db');
   s.ellipse(b.x-18,327,2,2,car?color:'#8fd7ad');
   if(car){const g=c.createRadialGradient(b.x,302,0,b.x,302,36);g.addColorStop(0,color+'28');g.addColorStop(1,color+'00');s.ellipse(b.x,302,36,24,g);}
  }else{
   s.ellipse(b.x+3,307,26,6,'#14233366');
   for(const x of [b.x-18,b.x+18]){line(s,[[x,284],[x-4,309]],'#bdc8bc',3);line(s,[[x,285],[x+6,309]],'#536a74',3);}
   s.rect(b.x-26,278,52,13,2,'#c8ae76');
   for(let n=0;n<5;n++)poly(s,[[b.x-25+n*11,279],[b.x-20+n*11,279],[b.x-25+n*11,290],[b.x-30+n*11,290]],'#3d4f59');
   s.rect(b.x-10,270,20,18,4,'#243a4c','#e0cf9b');s.text('+',b.x,279,19,'#ffdfa0');
   s.rect(b.x-27,320,54,14,3,'#263746');s.text('광고 +1',b.x,328,9,'#e6cf9f');
  }
 }
}
