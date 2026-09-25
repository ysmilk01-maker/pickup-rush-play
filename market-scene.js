import {stationEnvironment,stationBays} from './station-scene.js?v=42';
import {districtStyle,districtSky} from './district-scene.js?v=42';
import { Scene } from './scene.js?v=42';
import { BAY, QUEUE, carPose } from './traffic.js?v=42';
import { vehicleModel, makePassenger } from './appearance.js?v=42';
import { COLORS } from './game.js?v=42';

export class MarketScene extends Scene {
  constructor(canvas){super(canvas);this.reduceMotion=false;this.decoration='lantern';}
  background(t){
    const c=this.c,p=districtStyle(t.state.levelIndex),g=c.createLinearGradient(0,0,0,1080);
    g.addColorStop(0,p.sky);g.addColorStop(.37,p.horizon);g.addColorStop(1,p.deep);c.fillStyle=g;c.fillRect(0,0,600,1080);
    districtSky(this,p);
    c.strokeStyle=p.edge;c.lineWidth=1.5;c.beginPath();c.moveTo(0,67);c.quadraticCurveTo(300,120,600,67);c.stroke();
    for(let i=0;i<13;i++){
      const x=i*50,y=67+25*Math.sin(i/12*Math.PI),col=this.decoration==='mint'?'#a5f1d0':this.decoration==='sakura'?'#ffbad7':p.accent;
      const glow=c.createRadialGradient(x,y+5,0,x,y+5,22);glow.addColorStop(0,col+'55');glow.addColorStop(1,col+'00');this.ellipse(x,y+5,22,22,glow);
      this.rect(x-5,y,10,13,4,col);this.rect(x-3,y-3,6,3,1,'#795f59');
    }
    if(!t.state.emergency)this.text(`NIGHT ${String(t.state.levelIndex+1).padStart(2,'0')}  ·  ${t.state.levelTitle}`,300,87,13,'#f0d4ae');
    // The static architecture and pavement are cached at the current pixel ratio.
    c.fillStyle=p.road;c.fillRect(0,343,600,49);
    c.setLineDash([13,18]);c.strokeStyle='#b3997150';c.lineWidth=2;c.beginPath();c.moveTo(0,368);c.lineTo(600,368);c.stroke();c.setLineDash([]);
    stationEnvironment(this,p,t.state.levelIndex);
    // Passenger count is a backlit stop display, separate from the queue.
    this.rect(28,207,5,29,1,'#71888c');this.rect(87,207,5,29,1,'#71888c');
    this.rect(17,149,89,63,7,'#1a303e','#8ca5a5');this.rect(23,155,77,39,4,'#122738');
    this.text(t.state.queue.length,62,175,25,'#f0e7b9');this.text('대기 손님',62,201,10,'#c3d6cd');
    for(let i=0;i<6;i++){const x=124+i*76;this.ellipse(x,212,5,2,'#273a4577');this.rect(x-1,198,2,14,1,'#aebeb6');}
    c.strokeStyle='#ad9f8a';c.lineWidth=1.5;c.beginPath();c.moveTo(124,201);c.lineTo(505,201);c.stroke();
    this.rect(430,349,149,25,4,'#213340',p.edge);this.text('야시장 입구 →',504,361,12,'#e5d8b5');
    if(t.state.garage)for(let gate=0;gate<(t.state.levelIndex>=30?2:1);gate++){const x=gate?566:34,open=t.arriving.some(a=>a.gate===gate);this.rect(x-26,386,52,30,5,open?'#efbc78':'#2f414e','#9ca5a0');this.text(gate?'B':'A',x,402,17,open?'#553c44':'#f7d8a9');}
    stationBays(this,t);
    this.text(`${t.state.cars.length}대 대기  ·  ${t.delivered}/${t.total}명 탑승`,300,932,14,'#f4d6b2');
    // Visitors enjoying the night market.
    for(let i=0;i<4;i++){
      this.person(i<2?29+i*22:549+(i-2)*22,991,['red','yellow','cyan','purple'][i],this.reduceMotion?0:t.time,.64,false,makePassenger(i));
    }
  }
  draw(t,selected=null){
    this.background(t);this.hit=[];
    const offset=t.queueConsumed-t.queueVisual;
    for(let i=Math.min(24,t.state.queue.length)-1;i>=0;i--){
      const n=i+offset,a=QUEUE(Math.floor(n)),b=QUEUE(Math.ceil(n)),f=n%1;
      this.person(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,t.state.queue[i],this.reduceMotion?0:t.time+i*.17,1.08,offset>.02&&!this.reduceMotion,t.state.people[i]);
    }
    const cars=t.state.cars.map(car=>({car,pose:carPose(car,t.state),board:true}));
    for(const car of t.state.bays.filter(Boolean))cars.push({car,pose:{...car.pose},board:false});
    for(const incoming of t.arriving)cars.push({car:incoming.car,pose:incoming.pose,board:false});
    cars.sort((a,b)=>a.pose.y-b.pose.y);

    for(const {car,pose,board} of cars){
      if(car.emergency){const pulse=this.reduceMotion?.24:.16+.15*(1+Math.sin(t.time*3));this.c.globalAlpha=pulse;this.ellipse(pose.x,pose.y-12,31,20,'#70cfff');this.c.globalAlpha=1;}
      if(selected?.id===car.id&&selected.until>t.time){
        this.ellipse(pose.x,pose.y+5,vehicleModel(car).length*.55,20,'#ffe29788');
      }
      this.vehicle(car,pose,{parked:car.phase==='parked',arrow:board});if(board)this.hit.push({car,pose});
    }
    for(const passenger of t.walkers){
      if(!passenger.pose)continue;
      const end=Math.min(1,passenger.elapsed/passenger.duration),hop=this.reduceMotion?0:Math.sin(Math.max(0,end-.75)*Math.PI*4)*7;
      this.person(passenger.pose.x,passenger.pose.y-hop,passenger.color,this.reduceMotion?0:t.time,1.0*(end>.9?1-(end-.9)*3:1),!this.reduceMotion,passenger.person);
    }
  }
}
