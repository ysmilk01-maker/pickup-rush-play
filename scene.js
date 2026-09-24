import { COLORS, canExit } from './game.js?v=24';
import { BAY, QUEUE, carPose, DIRECTIONS } from './traffic.js?v=24';
import { vehicleModel, makePassenger } from './appearance.js?v=24';

const shade=(hex,f)=>'#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+f)).toString(16).padStart(2,'0')).join('');
export class Scene {
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.hit=[];this.resize();}
  resize(){const d=Math.min(devicePixelRatio||1,2);this.canvas.width=600*d;this.canvas.height=1080*d;this.c.setTransform(d,0,0,d,0,0);}
  polygon(points,fill,stroke=null,width=1){const c=this.c;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  rect(x,y,w,h,r,fill,stroke=null){const c=this.c;c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  text(s,x,y,size=20,color='#fff',align='center'){const c=this.c;c.font=`900 ${size}px system-ui, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);}
  ellipse(x,y,rx,ry,fill){const c=this.c;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
  background(t){
    const c=this.c;c.fillStyle='#b4c5da';c.fillRect(0,0,600,1080);
    // Continuous pavement, station facade, footpath and unmarked traffic lane.
    c.fillStyle='#9aaac2';c.fillRect(0,0,600,90);c.fillStyle='#7e92ad';c.fillRect(0,24,600,6);
    for(let x=0;x<600;x+=90){c.fillStyle='#b0bfd2';c.fillRect(x+4,34,83,55);}
    this.rect(88,74,444,78,6,'#6c879a');
    for(let x=95;x<520;x+=49){this.rect(x,82,43,62,0,'#24c8e7');this.polygon([{x:x+23,y:82},{x:x+39,y:82},{x:x+20,y:144},{x:x+4,y:144}],'#8beaf3');}
    this.rect(200,82,240,50,12,'#174f63');this.text(`레벨 ${t.state.levelIndex+1}`,320,107,24);
    c.fillStyle='#d1dce9';c.fillRect(0,227,600,4);c.fillRect(0,337,600,5);
    c.fillStyle='#8796a7';c.fillRect(0,343,600,49);c.fillStyle='#e9eff4';c.fillRect(0,391,600,4);
    c.fillStyle='#8ea3bb';c.fillRect(28,150,8,75);this.rect(22,136,85,67,7,'#6586a9');this.rect(30,145,69,43,4,'#274c7c');this.text(t.state.queue.length,64,168,28);this.text('대기 승객',64,198,12,'#fff4a9');
    // Queue rails.
    for(let x=139;x<530;x+=62){this.ellipse(x+5,217,9,3,'#8296ad');this.rect(x,190,4,26,2,'#eff5fa');this.rect(x,198,4,5,0,'#ec6f65');}
    c.strokeStyle='#de5e55';c.lineWidth=2;c.beginPath();c.moveTo(140,204);c.lineTo(535,204);c.lineTo(535,96);c.stroke();
    this.text('PICKUP RUSH',300,1022,13,'#667e9b');
    this.text(`${t.state.cars.length}대 남음`,300,980,15,'#526b86');
    // All seven bay outlines stay visible; three begin locked.
    for(let i=0;i<7;i++){const b=BAY(i);c.save();c.translate(b.x,b.y);c.rotate(-.48);c.setLineDash([9,7]);this.rect(-24,-47,48,94,10,i<t.state.bays.length?'#aebfd3':'#9aadc4','#e6edf5');c.setLineDash([]);if(i>=t.state.bays.length){this.text('▣',0,-9,22,'#dce7f2');this.text('광고 +1',0,15,12,'#f6faff');}c.restore();}
  }
  person(x,y,color,phase=0,scale=1,walking=false,person=makePassenger(0)){
    const c=this.c,col=COLORS[color].hex,bob=walking?Math.sin(phase*22)*2:Math.sin(phase*3)*.6;
    c.save();c.translate(x,y);c.scale(scale,scale);this.ellipse(3,2,8,3,'#647b9448');
    const leg=walking?Math.sin(phase*22)*4:0;
    c.lineCap='round';c.lineWidth=4.3;c.strokeStyle=person.outfit==='skirt'?person.skin:shade(col,-45);c.beginPath();c.moveTo(-3,-8);c.lineTo(-3+leg,0);c.moveTo(3,-8);c.lineTo(3-leg,0);c.stroke();
    this.ellipse(-3+leg,1,3,1.8,'#394554');this.ellipse(3-leg,1,3,1.8,'#394554');
    if(person.hairstyle==='ponytail'){this.ellipse(7,-25+bob,5,9,person.hair);this.ellipse(7,-30+bob,3,2,col);}
    if(person.hairstyle==='bob')this.rect(-8,-32+bob,16,16,6,person.hair);
    c.lineWidth=4;c.strokeStyle=col;c.beginPath();c.moveTo(-4,-18+bob);c.lineTo(-7-leg*.4,-11+bob);c.moveTo(4,-18+bob);c.lineTo(7+leg*.4,-11+bob);c.stroke();
    this.ellipse(-7-leg*.4,-9+bob,2.2,2.8,person.skin);this.ellipse(7+leg*.4,-9+bob,2.2,2.8,person.skin);
    this.rect(-5,-22+bob,10,15,4,col,shade(col,-26));
    if(person.outfit==='skirt')this.polygon([{x:-4,y:-14+bob},{x:4,y:-14+bob},{x:8,y:-5+bob},{x:-8,y:-5+bob}],col,shade(col,-25));
    else {c.strokeStyle=shade(col,40);c.lineWidth=1;c.beginPath();c.moveTo(0,-18+bob);c.lineTo(0,-9+bob);c.stroke();}
    this.rect(-2,-25+bob,4,5,1,person.skin);
    const g=c.createRadialGradient(-2,-31+bob,1,0,-28+bob,8);g.addColorStop(0,shade(person.skin,25));g.addColorStop(1,person.skin);this.ellipse(0,-28+bob,7,8,g);
    // Short hair, side-part, bob and ponytail remain attached to the same passenger.
    c.beginPath();c.ellipse(0,-30+bob,7.5,7,0,Math.PI,Math.PI*2);c.lineTo(7,-28+bob);c.quadraticCurveTo(2,-29+bob,person.hairstyle==='sidepart'?-5:0,-33+bob);c.lineTo(-7,-27+bob);c.closePath();c.fillStyle=person.hair;c.fill();
    if(person.hairstyle==='bob'){this.rect(-8,-30+bob,3,10,2,person.hair);this.rect(5,-30+bob,3,10,2,person.hair);}
    this.ellipse(-2.5,-27+bob,.7,1,'#3c3435');this.ellipse(2.5,-27+bob,.7,1,'#3c3435');
    c.strokeStyle='#a65f53';c.lineWidth=.8;c.beginPath();c.arc(0,-25+bob,1.5,0,Math.PI);c.stroke();c.restore();
  }
  vehicle(car,pose,{parked=false,arrow=true}={}){
    const c=this.c,col=COLORS[car.color].hex;
    const model=vehicleModel(car),{length,width,body:height,roof:roofHeight}=model;
    const kind=car.model||car.type,passengerCar=kind==='sedan'||kind==='taxi'||kind==='suv';
    const a=pose.angle,ca=Math.cos(a),sa=Math.sin(a);
    // A true extruded body: every face, wheel and window uses the same projection.
    const p=(u,v,z=0)=>({x:pose.x+u*ca-v*sa,y:pose.y+(u*sa+v*ca)*.83-z});
    const l=length/2,w=width/2,k=kind==='bus'?3:5;
    const corners=[[-l+k,-w],[l-k,-w],[l,-w+k],[l,w-k],[l-k,w],[-l+k,w],[-l,w-k],[-l,-w+k]];
    const bottom=corners.map(([u,v])=>p(u,v,4)),top=corners.map(([u,v])=>p(u,v,height));
    this.polygon(corners.map(([u,v])=>{const q=p(u,v);return{x:q.x+5,y:q.y+5};}),'#435c7860');
    for(const u of [-length*.32,length*.32])for(const v of [-width/2,width/2]){const q=p(u,v,3);this.ellipse(q.x,q.y,4,5,'#293841');this.ellipse(q.x,q.y,1.7,2.5,'#8295a2');}
    const faces=corners.map((_,i)=>({i,y:(bottom[i].y+bottom[(i+1)%8].y)/2})).sort((a,b)=>a.y-b.y);
    for(const {i} of faces)this.polygon([bottom[i],bottom[(i+1)%8],top[(i+1)%8],top[i]],shade(col,i<3?-12:-40),shade(col,-55));
    this.polygon(top,shade(col,16),shade(col,-30),1.5);
    if(passengerCar){
      // Low hood and trunk with a separate raised cabin; SUVs have a longer tall cabin.
      const rear=kind==='suv'?-.38:-.28,front=kind==='suv'?.19:.15;
      const base=[[-length*.39,-w+2],[length*.33,-w+2],[length*.33,w-2],[-length*.39,w-2]].map(([u,v])=>p(u,v,height+.5));
      const roof=[[length*rear,-w+4],[length*front,-w+4],[length*front,w-4],[length*rear,w-4]].map(([u,v])=>p(u,v,roofHeight));
      for(let i=0;i<4;i++)this.polygon([base[i],base[(i+1)%4],roof[(i+1)%4],roof[i]],i%2?'#17394e':'#285575',shade(col,-15));
      this.polygon(roof,shade(col,32),shade(col,-16));
      for(const v of [-w+1,w-1]){const q=p(-length*.05,v,height+3),r=p(-length*.05,v,roofHeight-1);c.strokeStyle=shade(col,-20);c.lineWidth=2;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(r.x,r.y);c.stroke();}
      if(kind==='taxi'){
        const sign=[[-7,-4],[3,-4],[3,4],[-7,4]].map(([u,v])=>p(u-length*.13,v,roofHeight+5));
        this.polygon(sign,'#fff5a9','#a88128');const q=p(-length*.18,0,roofHeight+6);this.text('T',q.x,q.y,6,'#433b21');
        for(let i=0;i<5;i++)for(const v of [-w-.3,w+.3])this.polygon([p(-11+i*4,v,5),p(-8+i*4,v,5),p(-8+i*4,v,7.5),p(-11+i*4,v,7.5)],i%2?'#fff5cd':'#3b4147');
      }
      if(kind==='suv')for(const v of [-w+5,w-5]){const q=p(-length*.31,v,roofHeight+2),r=p(length*.1,v,roofHeight+2);c.strokeStyle='#c7d3db';c.lineWidth=2;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(r.x,r.y);c.stroke();}
    }else{
      const roof=corners.map(([u,v])=>p(u*.9,v*.8,roofHeight));this.polygon(roof,shade(col,35));
      this.polygon([p(length*.3,-w+3,roofHeight),p(length*.46,-w+3,height),p(length*.46,w-3,height),p(length*.3,w-3,roofHeight)],'#153b54');
      const n=kind==='bus'?6:3;
      for(let j=0;j<n;j++){const u=-length*.4+j*(length*.74/n);for(const v of [-w-.2,w+.2])this.polygon([p(u,v,height-8),p(u+length*.52/n,v,height-8),p(u+length*.52/n,v,height-2),p(u,v,height-2)],'#1c4058');}
      if(kind==='van')for(const v of [-w-.3,w+.3]){
        this.polygon([p(-length*.15,v,5),p(length*.21,v,5),p(length*.21,v,height-1),p(-length*.15,v,height-1)],null,shade(col,-42),1);
        const q=p(length*.15,v,10);this.ellipse(q.x,q.y,2.5,1,'#dce8ef');
      }
      if(kind==='bus'){
        // White air-conditioning pod, rear vents, front destination panel and double door.
        this.polygon([p(-37,-7,roofHeight+2),p(-18,-7,roofHeight+2),p(-18,7,roofHeight+2),p(-37,7,roofHeight+2)],'#e6ebed','#92a8b6');
        for(let i=0;i<4;i++){const q=p(-33+i*3,-5,roofHeight+3),r=p(-33+i*3,5,roofHeight+3);c.strokeStyle='#9bafba';c.lineWidth=1;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(r.x,r.y);c.stroke();}
        for(const v of [-w-.3,w+.3])this.polygon([p(length*.3,v,4),p(length*.44,v,4),p(length*.44,v,height-2),p(length*.3,v,height-2)],'#193b51',shade(col,-15));
        this.polygon([p(l+.4,-8,height-1),p(l+.4,8,height-1),p(l+.4,8,height-5),p(l+.4,-8,height-5)],'#1c3147');
      }
    }
    for(const v of [-8,8]){const q=p(length/2+.3,v,7);this.ellipse(q.x,q.y,2.4,2,'#fff5bb');const rear=p(-length/2-.3,v,7);this.ellipse(rear.x,rear.y,2,2,'#fa504c');}
    if(arrow){const s=Math.min(length*.26,20),z=roofHeight+7,offset=kind==='taxi'?6:kind==='bus'?8:0;const ar=(u,v)=>p(u+offset,v,z);this.polygon([ar(-s,-2.5),ar(s*.3,-2.5),ar(s*.3,-6),ar(s,0),ar(s*.3,6),ar(s*.3,2.5),ar(-s,2.5)],'#fff', '#42525b',1.3);}
    if(parked){
      for(let i=0;i<car.loaded;i++){const q=p(-length*.27+(i%5)*length*.13,(Math.floor(i/5)-.5)*11,roofHeight+6);this.person(q.x,q.y,car.color,0,.45,false,car.passengers?.[i]);}
      this.rect(pose.x-17,pose.y+17,34,17,6,'#274767');this.text(`${car.loaded}/${car.capacity}`,pose.x,pose.y+26,11);
    }
  }
  draw(t,selected=null){
    const c=this.c;this.background(t);this.hit=[];
    const queueOffset=t.queueConsumed-t.queueVisual;
    const queuePeople=t.state.queue.slice(0,24).map((color,i)=>({color,i})).reverse();
    for(const {color,i} of queuePeople){const n=i+queueOffset,a=QUEUE(Math.floor(n)),b=QUEUE(Math.ceil(n)),f=n%1;this.person(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,color,t.time+i*.17,.92,queueOffset>.02,t.state.people[i]);}
    for(const p of t.puffs){c.globalAlpha=(1-p.age/.5)*.6;this.ellipse(p.x-8*p.age,p.y,4+p.age*10,3+p.age*7,'#fff');}c.globalAlpha=1;
    const cars=t.state.cars.map(car=>({car,pose:carPose(car,t.state),board:true}));
    for(const car of t.state.bays.filter(Boolean))cars.push({car,pose:car.pose,board:false});
    cars.sort((a,b)=>a.pose.y-b.pose.y);
    for(const item of cars){
      const {car,pose,board}=item;
      if(selected?.id===car.id&&selected.until>t.time){pose.x+=Math.sin(t.time*80)*3;}
      this.vehicle(car,pose,{parked:car.phase==='parked',arrow:board});
      if(board)this.hit.push({car,pose});
    }
    for(const p of t.walkers){if(!p.pose)continue;const end=p.elapsed/p.duration;this.person(p.pose.x,p.pose.y-Math.sin(Math.min(1,Math.max(0,(end-.8)*5))*Math.PI)*9,p.color,t.time,.8*(end>.85?1-(end-.85)*2:1),true,p.person);}
  }
  pick(x,y){
    for(const {car,pose} of [...this.hit].reverse()){
      const model=vehicleModel(car);
      const dx=x-pose.x,dy=(y-pose.y+model.roof*.7)/.83,ca=Math.cos(pose.angle),sa=Math.sin(pose.angle);
      const u=dx*ca+dy*sa,v=-dx*sa+dy*ca;
      if(Math.abs(u)<model.length/2+5&&Math.abs(v)<model.width/2+5)return car;
    }return null;
  }
}
