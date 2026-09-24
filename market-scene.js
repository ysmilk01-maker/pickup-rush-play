import { Scene } from './scene.js?v=18';
import { BAY, carPose } from './traffic.js?v=18';
import { vehicleModel, makePassenger } from './appearance.js?v=18';
import { COLORS } from './game.js?v=18';
import { RECIPES, INGREDIENTS, PANTRY } from './market.js?v=18';

const shade=(hex,n)=>'#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+n)).toString(16).padStart(2,'0')).join('');
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
      const x=i*50,y=67+25*Math.sin(i/12*Math.PI),col=this.decoration==='mint'?'#a5f1d0':'#ffd58a';
      const glow=c.createRadialGradient(x,y+5,0,x,y+5,22);glow.addColorStop(0,col+'55');glow.addColorStop(1,col+'00');this.ellipse(x,y+5,22,22,glow);
      this.rect(x-5,y,10,13,4,col);this.rect(x-3,y-3,6,3,1,'#795f59');
    }
    this.text(`NIGHT ${String(t.state.levelIndex+1).padStart(2,'0')}  ·  ${t.state.levelTitle}`,300,87,13,'#f0d4ae');
    // The expanded recipe cards above show named ingredients and loaded counts.
    // Serving deck and the outer driving lane.
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
    this.text('같은 색 + 같은 도형의 트럭을 찾아요',300,417,14,'#ffe5b7');
    for(let i=0;i<7;i++){
      const b=BAY(i),open=i<t.state.bays.length;
      this.ellipse(b.x,b.y+23,30,10,open?'#f3cb9340':'#24223344');
      this.rect(b.x-29,b.y+30,58,16,5,open?'#443849':'#4b424e');
      this.text(open?`주방 ${i+1}`:'AD +1',b.x,b.y+38,10,open?'#ffe2a5':'#c1acbc');
      if(!open){this.text('+',b.x,b.y-7,28,'#c9aab2');this.text('확장',b.x,b.y+12,10,'#dec5ca');}
    }
    this.text(`${t.state.cars.length}대 대기  ·  ${t.completed}/${t.total}접시 완성`,300,932,14,'#f4d6b2');
    // A tiny night-market crowd: the people now enjoy the food, rather than act as cargo.
    for(let i=0;i<4;i++){
      this.person(i<2?29+i*22:549+(i-2)*22,991,['red','yellow','cyan','purple'][i],this.reduceMotion?0:t.time,.64,false,makePassenger(i));
    }
  }
  ingredient(x,y,key,time,scale=1,walking=true){
    const c=this.c,info=INGREDIENTS[key],phase=this.reduceMotion?0:time*18;
    c.save();c.translate(x,y);c.scale(scale,scale);
    this.ellipse(2,1,11,3,'#19182a55');
    const stride=walking?Math.sin(phase)*4:0;
    c.strokeStyle='#fff0d6';c.lineWidth=2.6;c.lineCap='round';c.beginPath();
    c.moveTo(-4,-6);c.lineTo(-5+stride,0);c.moveTo(4,-6);c.lineTo(5-stride,0);c.stroke();
    this.text(info.icon,0,-15-(walking?Math.abs(Math.sin(phase))*2:0),25);
    this.ellipse(-4,-13,1.3,1.7,'#322539');this.ellipse(4,-13,1.3,1.7,'#322539');
    c.restore();
  }
  truck(car,pose,board){
    const c=this.c,model=vehicleModel(car),l=model.length/2,w=model.width/2;
    const col=COLORS[car.color].hex,a=pose.angle,ca=Math.cos(a),sa=Math.sin(a);
    const p=(u,v,z=0)=>({x:pose.x+u*ca-v*sa,y:pose.y+(u*sa+v*ca)*.83-z});
    const h=car.type==='taxi'?15:car.type==='van'?21:25;
    const corners=[[-l,-w],[l-5,-w],[l,-w+5],[l,w-5],[l-5,w],[-l,w]];
    const bottom=corners.map(([u,v])=>p(u,v,4)),top=corners.map(([u,v])=>p(u,v,h));
    this.polygon(corners.map(([u,v])=>p(u+4,v+4)), '#211d346b');
    for(const u of [-l*.65,l*.65])for(const v of [-w,w]){
      const q=p(u,v,3);this.ellipse(q.x,q.y,4,5,'#202333');this.ellipse(q.x,q.y,1.7,2.5,'#abb8c2');
    }
    const faces=corners.map((_,i)=>({i,y:(bottom[i].y+bottom[(i+1)%6].y)/2})).sort((a,b)=>a.y-b.y);
    for(const {i} of faces)this.polygon([bottom[i],bottom[(i+1)%6],top[(i+1)%6],top[i]],shade(col,i<3?-22:-49),shade(col,-68));
    this.polygon(top,shade(col,24),shade(col,-36),1.2);
    this.polygon([p(l*.42,-w+2,h+1),p(l*.8,-w+2,h+1),p(l*.8,w-2,h+1),p(l*.42,w-2,h+1)],'#293d55','#91bfd0');
    // A serving window and striped awning on both sides, contained in the footprint.
    for(const side of [-1,1]){
      this.polygon([p(-l*.78,side*(w+.2),7),p(l*.22,side*(w+.2),7),p(l*.22,side*(w+.2),h-2),p(-l*.78,side*(w+.2),h-2)],'#303043','#ffe2ab',1);
      for(let j=0;j<4;j++){
        const u=-l*.8+j*l*.25;
        this.polygon([p(u,side*(w-2),h+1),p(u+l*.25,side*(w-2),h+1),p(u+l*.25,side*(w+.5),h-2),p(u,side*(w+.5),h-2)],j%2?'#fff1cc':shade(col,-5));
      }
    }
    const badge=p(-l*.33,0,h+4),recipe=RECIPES[car.recipe];
    this.ellipse(badge.x,badge.y-3,car.type==='taxi'?10:13,car.type==='taxi'?8:10,'#fff4d4');
    this.text(recipe.mark,badge.x,badge.y-4,car.type==='taxi'?18:24,'#302438');
    if(car.type==='bus'){
      const vent=p(-l*.77,0,h+3);this.ellipse(vent.x,vent.y,5,3,'#536271');
    }
    for(const v of [-w*.55,w*.55]){const light=p(l+.5,v,8);this.ellipse(light.x,light.y,2,2,'#ffefb1');}
    if(board){
      const at=l*.49,s=car.type==='taxi'?8:12,ar=(u,v)=>p(u+at,v,h+6);
      this.polygon([ar(-s,-2),ar(s*.2,-2),ar(s*.2,-5),ar(s,0),ar(s*.2,5),ar(s*.2,2),ar(-s,2)],'#ffffff','#333d51',1);
    }else{
      const text=car.phase==='cooking'?'조리 중':car.phase==='leaving'?'완성!':car.orderId===null?'주문 대기':`${car.loaded}/${car.capacity}`;
      this.rect(pose.x-25,pose.y+11,50,16,5,car.phase==='cooking'?'#ffce69':'#25283e');
      this.text(text,pose.x,pose.y+19,10,car.phase==='cooking'?'#563d26':'#fff0c7');
      if(car.phase==='cooking'){
        const percent=Math.min(1,car.cookElapsed/1.15);this.rect(pose.x-22,pose.y+30,44,3,1,'#29263f');this.rect(pose.x-22,pose.y+30,44*percent,3,1,'#ffdd89');
        if(!this.reduceMotion)for(let i=0;i<3;i++){
          const life=(car.cookElapsed*1.5+i/3)%1;c.globalAlpha=1-life;this.ellipse(pose.x+(i-1)*9,pose.y-h-10-life*25,4+life*4,3+life*4,'#fff4d6');c.globalAlpha=1;
        }
      }
    }
  }
  draw(t,selected=null){
    this.background(t);this.hit=[];
    const cars=t.state.cars.map(car=>({car,pose:carPose(car,t.state),board:true}));
    for(const car of t.state.bays.filter(Boolean))cars.push({car,pose:{...car.pose},board:false});
    cars.sort((a,b)=>a.pose.y-b.pose.y);
    const preferred=t.orders.find(o=>o.id===t.preferred)?.recipe;
    for(const {car,pose,board} of cars){
      if(selected?.id===car.id&&selected.until>t.time){
        this.ellipse(pose.x,pose.y+5,vehicleModel(car).length*.55,20,'#ffe29788');
      }
      if(board&&preferred&&car.recipe===preferred){
        const model=vehicleModel(car),ca=Math.cos(pose.angle),sa=Math.sin(pose.angle);
        const outline=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{u*=model.length/2+4;v*=model.width/2+4;return {x:pose.x+u*ca-v*sa,y:pose.y+(u*sa+v*ca)*.83};});
        this.polygon(outline,'#fff1bf28','#fff1bc',2.5);
      }
      this.c.globalAlpha=board&&preferred&&car.recipe!==preferred ? .65 : 1;
      this.truck(car,pose,board);this.c.globalAlpha=1;if(board)this.hit.push({car,pose});
    }
    for(const ingredient of t.walkers){
      if(!ingredient.pose)continue;
      const end=Math.min(1,ingredient.elapsed/ingredient.duration),hop=this.reduceMotion?0:Math.sin(Math.max(0,end-.75)*Math.PI*4)*7;
      this.ingredient(ingredient.pose.x,ingredient.pose.y-hop,ingredient.key,t.time,.83*(end>.9?1-(end-.9)*3:1));
    }
    for(const celebration of t.celebrations){
      this.c.globalAlpha=Math.min(1,(1.5-celebration.age)*2);
      this.text(`${RECIPES[celebration.recipe].icon} 맛있게 드세요!`,celebration.x,celebration.y-(this.reduceMotion?0:celebration.age*18),15,'#ffe5a0');this.c.globalAlpha=1;
    }
  }
}
