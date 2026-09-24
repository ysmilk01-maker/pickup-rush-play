import { Scene } from './scene.js?v=23';
import { BAY, QUEUE, carPose } from './traffic.js?v=23';
import { vehicleModel, makePassenger } from './appearance.js?v=23';
import { COLORS } from './game.js?v=23';

export class MarketScene extends Scene {
  constructor(canvas){super(canvas);this.reduceMotion=false;this.decoration='lantern';}
  background(t){
    const c=this.c,g=c.createLinearGradient(0,0,0,1080);
    g.addColorStop(0,'#161831');g.addColorStop(.37,'#302940');g.addColorStop(1,'#211e33');c.fillStyle=g;c.fillRect(0,0,600,1080);
    for(let i=0;i<15;i++){
      const x=i*44,h=25+(i*31)%55;this.rect(x,78-h,39,h,3,'#252641');
      for(let j=0;j<3;j++)this.rect(x+8+j*9,67-h,4,7,1,i%3?'#ffc77b65':'#7e81bb50');
    }
    c.strokeStyle='#b7a08d';c.lineWidth=1.5;c.beginPath();c.moveTo(0,67);c.quadraticCurveTo(300,120,600,67);c.stroke();
    for(let i=0;i<13;i++){
      const x=i*50,y=67+25*Math.sin(i/12*Math.PI),col=this.decoration==='mint'?'#a5f1d0':this.decoration==='sakura'?'#ffbad7':'#ffd58a';
      const glow=c.createRadialGradient(x,y+5,0,x,y+5,22);glow.addColorStop(0,col+'55');glow.addColorStop(1,col+'00');this.ellipse(x,y+5,22,22,glow);
      this.rect(x-5,y,10,13,4,col);this.rect(x-3,y-3,6,3,1,'#795f59');
    }
    this.text(`NIGHT ${String(t.state.levelIndex+1).padStart(2,'0')}  ·  ${t.state.levelTitle}`,300,87,13,'#f0d4ae');
    // Night-market visitors wait for their color-coded shuttle.
    this.rect(21,155,83,57,9,'#2a263b','#ad8564');
    this.text(t.state.queue.length,62,176,24,'#fff1c9');this.text('대기 손님',62,199,11,'#e7bf8a');
    this.rect(115,196,397,13,6,'#836b6e');
    c.strokeStyle='#d7aa77';c.lineWidth=2;c.beginPath();c.moveTo(126,212);c.lineTo(522,212);c.lineTo(522,94);c.stroke();
    this.text('↓ 탑승',137,230,12,'#ffe2aa');
    // Shuttle platform and the road leading to the night market.
    this.rect(12,250,576,87,13,'#79656b');
    c.fillStyle='#cfad82';c.fillRect(0,337,600,5);
    c.fillStyle='#232536';c.fillRect(0,343,600,49);
    c.setLineDash([13,18]);c.strokeStyle='#b3997150';c.lineWidth=2;c.beginPath();c.moveTo(0,368);c.lineTo(600,368);c.stroke();c.setLineDash([]);
    this.rect(13,401,574,515,26,'#514953','#8d7779');
    const floor=c.createLinearGradient(0,400,0,916);floor.addColorStop(0,'#756574');floor.addColorStop(1,'#5b505e');
    this.rect(18,406,564,505,23,floor);
    // Soft pools of light and scattered paper flecks break up the pavement.
    for(let i=0;i<5;i++){
      const x=70+i*116,y=435+(i%2)*420,glow=c.createRadialGradient(x,y,0,x,y,80);
      glow.addColorStop(0,'#ffdaa916');glow.addColorStop(1,'#ffdaa900');this.ellipse(x,y,80,80,glow);
    }
    for(let i=0;i<26;i++){const x=34+(i*163)%530,y=432+(i*83)%459;this.rect(x,y,3,2,1,'#d4b0a51f');}
    this.text('같은 색 셔틀을 타고 야시장으로!',300,417,14,'#ffe5b7');
    this.rect(424,348,160,30,7,'#5c4149','#c19b6c');this.text('야시장 입구 →',504,363,15,'#ffe5b7');
    for(let i=0;i<7;i++){
      const b=BAY(i),open=i<t.state.bays.length;
      this.ellipse(b.x,b.y+23,30,10,open?'#f3cb9340':'#24223344');
      this.rect(b.x-29,b.y+30,58,16,5,open?'#443849':'#4b424e');
      this.text(open?`승강장 ${i+1}`:'AD +1',b.x,b.y+38,10,open?'#ffe2a5':'#c1acbc');
      if(!open){this.text('+',b.x,b.y-7,28,'#c9aab2');this.text('확장',b.x,b.y+12,10,'#dec5ca');}
    }
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
    cars.sort((a,b)=>a.pose.y-b.pose.y);

    for(const {car,pose,board} of cars){
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
