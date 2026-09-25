import {cutPose,cutBadge} from './queue-cut-scene.js?v=56';
import {drawGates,drawBlockage} from './puzzle-scene.js?v=56';
import {stationEnvironment,stationBays} from './station-scene.js?v=56';
import {districtStyle,districtSky} from './district-scene.js?v=56';
import { Scene } from './scene.js?v=56';
import { BAY, QUEUE, carPose } from './traffic.js?v=56';
import { vehicleModel, makePassenger } from './appearance.js?v=56';
import { COLORS } from './game.js?v=56';

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
    if(!t.state.emergency&&!t.state.queueCut)this.text(`NIGHT ${String(t.state.levelIndex+1).padStart(2,'0')}  ·  ${t.state.levelTitle}`,300,87,13,'#365e6e');
    // The static architecture and pavement are cached at the current pixel ratio.
    c.fillStyle=p.road;c.fillRect(0,343,600,49);
    c.setLineDash([13,18]);c.strokeStyle='#b3997150';c.lineWidth=2;c.beginPath();c.moveTo(0,368);c.lineTo(600,368);c.stroke();c.setLineDash([]);
    stationEnvironment(this,p,t.state.levelIndex);
    // Passenger count is a backlit stop display, separate from the queue.
    this.rect(28,207,5,29,1,'#71888c');this.rect(87,207,5,29,1,'#71888c');
    this.rect(17,149,89,63,7,'#fff9e8','#ffffff');this.rect(23,155,77,39,4,'#d9f3ef');
    this.text(t.state.queue.length,62,175,25,'#2f616d');this.text('대기 손님',62,201,10,'#43646b');
    for(let i=0;i<6;i++){const x=124+i*76;this.ellipse(x,212,5,2,'#273a4577');this.rect(x-1,198,2,14,1,'#aebeb6');}
    c.strokeStyle='#ad9f8a';c.lineWidth=1.5;c.beginPath();c.moveTo(124,201);c.lineTo(505,201);c.stroke();
    this.rect(430,349,149,25,4,'#f8fce9',p.edge);this.text('야시장 입구 →',504,361,12,'#3c6976');
    if(t.state.garage)for(let gate=0;gate<(t.state.levelIndex>=30?2:1);gate++){const x=gate?566:34,open=t.arriving.some(a=>a.gate===gate);this.rect(x-26,386,52,30,5,open?'#efbc78':'#edf7e9','#9ca5a0');this.text(gate?'B':'A',x,402,17,open?'#553c44':'#49696b');}
    stationBays(this,t);
    this.text(`${t.state.cars.length}대 대기  ·  ${t.delivered}/${t.total}명 탑승`,300,932,14,'#456777');
    // Visitors enjoying the night market.
    for(let i=0;i<4;i++){
      this.person(i<2?29+i*22:549+(i-2)*22,991,['red','yellow','cyan','purple'][i],this.reduceMotion?0:t.time,.64,false,makePassenger(i));
    }
  }
  draw(t,selected=null){
    if(this.lastTraffic!==t){this.lastTraffic=t;this.gateFrames=new Map();this.revealFrames=new Map();}
    this.levelIndex=t.state.levelIndex;this.puzzleKeys=new Map((t.state.puzzle?.gates||[]).filter(g=>!g.open).map(g=>[g.keyId,g.id.at(-1)]));this.background(t);this.hit=[];
    drawGates(this,t);drawBlockage(this,t,selected);
    const offset=t.queueConsumed-t.queueVisual;
    for(let i=Math.min(24,t.state.queue.length)-1;i>=0;i--){
      const n=i+offset,a=QUEUE(Math.floor(n)),b=QUEUE(Math.ceil(n)),f=n%1;
      const person=t.state.people[i],cut=cutPose(t,person,i,this.reduceMotion),x=cut?.x??a.x+(b.x-a.x)*f,y=cut?.y??a.y+(b.y-a.y)*f;
      this.person(x,y,t.state.queue[i],this.reduceMotion?0:t.time+i*.17,1.08,(!!cut||offset>.02)&&!this.reduceMotion,person);cutBadge(this,t,person,x,y);
    }
    const cars=t.state.cars.map(car=>({car,pose:carPose(car,t.state),board:true}));
    for(const car of t.state.bays.filter(Boolean))cars.push({car,pose:{...car.pose},board:false});
    for(const incoming of t.arriving)cars.push({car:incoming.car,pose:incoming.pose,board:false});
    cars.sort((a,b)=>a.pose.y-b.pose.y);

    for(const {car,pose,board} of cars){
      if(car.emergency){const pulse=this.reduceMotion?.24:.16+.15*(1+Math.sin(t.time*3));this.c.globalAlpha=pulse;this.ellipse(pose.x,pose.y-12,31,20,'#70cfff');this.c.globalAlpha=1;}
      if(selected?.id===car.id&&selected.until>t.time){
        this.ellipse(pose.x,pose.y+5,vehicleModel(car).length*.55,20,selected.navigator?'#72edcdbb':'#ffe29788');
        if(selected.navigator){this.rect(pose.x-24,pose.y-51,48,20,8,'#246f63','#d4fff0');this.text('추천',pose.x,pose.y-41,12,'#fffef2');}
      }
      this.revealFrames??=new Map();let reveal=this.revealFrames.get(car.id);
      if(car.covered&&!car.revealed){reveal={hidden:true,at:t.time};this.revealFrames.set(car.id,reveal);}
      else if(reveal?.hidden){reveal.hidden=false;reveal.at=t.time;}
      this.vehicle(car,pose,{parked:car.phase==='parked',arrow:board});
      if(reveal&&!reveal.hidden&&!this.reduceMotion){const alpha=Math.max(0,1-(t.time-reveal.at)/.22);if(alpha){this.c.globalAlpha=alpha;this.vehicle({...car,covered:true,revealed:false},pose,{arrow:board});this.c.globalAlpha=1;}}
      if(board)this.hit.push({car,pose});
    }
    for(const passenger of t.walkers){
      if(!passenger.pose)continue;
      const end=Math.min(1,passenger.elapsed/passenger.duration),hop=this.reduceMotion?0:Math.sin(Math.max(0,end-.75)*Math.PI*4)*7;
      this.person(passenger.pose.x,passenger.pose.y-hop,passenger.color,this.reduceMotion?0:t.time,1.0*(end>.9?1-(end-.9)*3:1),!this.reduceMotion,passenger.person);cutBadge(this,t,passenger.person,passenger.pose.x,passenger.pose.y-hop);
    }
  }
}
