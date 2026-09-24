import {Scene} from './scene.js?v=23';
import {makePassenger} from './appearance.js?v=23';

// Original vector illustration. It uses no screenshots or artwork from another game.
export class LobbyScene extends Scene{
  draw(time=0,theme='lantern',reduced=false){
    const c=this.c,accent=theme==='mint'?'#8cf0d7':theme==='sakura'?'#ffbad7':'#ffc67d';
    const sky=c.createLinearGradient(0,0,0,1080);sky.addColorStop(0,'#18254c');sky.addColorStop(.48,'#746787');sky.addColorStop(1,'#f1b694');c.fillStyle=sky;c.fillRect(0,0,600,1080);
    for(let i=0;i<30;i++){const x=(i*173+31)%600,y=80+(i*71)%340;this.ellipse(x,y,i%3?1:2,i%3?1:2,'#fff1c599');}
    const moon=c.createRadialGradient(410,190,25,410,190,120);moon.addColorStop(0,'#fff0c928');moon.addColorStop(1,'#fff0c900');this.ellipse(410,190,120,120,moon);this.ellipse(410,190,47,47,'#ffedc7');this.ellipse(428,177,39,39,'#5d5d80');
    // Hill silhouettes, town houses and the illuminated river bridge.
    this.polygon([{x:0,y:340},{x:90,y:257},{x:179,y:329},{x:274,y:249},{x:424,y:361},{x:600,y:292},{x:600,y:570},{x:0,y:570}],'#394666');
    for(let i=0;i<10;i++){
      const x=i*66-10,h=70+(i*37)%100,y=428-h;
      this.rect(x,y,54,h+35,3,i%2?'#535b78':'#465372');
      for(let j=0;j<3;j++)for(let k=0;k<4;k++)this.rect(x+8+j*14,y+12+k*22,7,11,2,(j+k+i)%3?'#ffdc926b':'#a1cfda33');
    }
    this.rect(0,451,600,124,0,'#51748a');
    for(let i=0;i<12;i++)this.rect(40+(i*117)%520,462+i*8,25+(i%3)*20,2,1,'#f4ce9366');
    c.strokeStyle='#bc9694';c.lineWidth=12;c.beginPath();c.moveTo(-20,460);c.quadraticCurveTo(300,355,620,460);c.stroke();
    for(let i=0;i<12;i++){const x=i*55,y=460-55*Math.sin(i/11*Math.PI);this.rect(x,y,6,71,2,'#84677c');this.ellipse(x+3,y-4,4,4,accent);}
    // Festival stalls at either side frame the hero station.
    for(const [x,col,label] of [[-24,'#cf7876','국수'],[483,'#609e9d','분식']]){
      this.rect(x,484,145,194,10,'#79576a');this.rect(x+9,504,127,110,6,'#ffdb9c');
      this.rect(x+20,526,103,67,3,'#704454');this.text(label,x+72,558,28,'#ffe7b7');
      for(let j=0;j<6;j++)this.rect(x+j*24,479,25,29,4,j%2?col:'#ffe6b4');
      this.rect(x+6,612,132,12,3,'#ae7773');this.rect(x+16,655,115,8,4,'#403b53');
    }
    const ground=c.createLinearGradient(0,588,0,1000);ground.addColorStop(0,'#bd9291');ground.addColorStop(1,'#3d3b59');this.polygon([{x:120,y:580},{x:480,y:580},{x:660,y:980},{x:-60,y:980}],ground);
    for(let i=0;i<4;i++)this.rect(70+i*137,665+i*23,58,5,2,'#fbe2bf35');
    c.strokeStyle='#2f334f';c.lineWidth=3;c.beginPath();c.moveTo(0,283);c.quadraticCurveTo(300,420,600,280);c.stroke();
    for(let i=0;i<11;i++){
      const x=i*60,y=283+67*Math.sin(i/10*Math.PI),bob=reduced?0:Math.sin(time+i)*1.5;
      const glow=c.createRadialGradient(x,y,1,x,y,36);glow.addColorStop(0,accent+'44');glow.addColorStop(1,accent+'00');this.ellipse(x,y,36,36,glow);
      this.rect(x-9,y-5+bob,18,27,7,accent);this.rect(x-5,y-9+bob,10,4,1,'#6c4e59');this.rect(x-2,y+22+bob,4,8,1,'#ffd694');
    }
    // The pavilion is the main focal point, with a large legible destination sign.
    this.ellipse(300,762,219,30,'#202a4844');
    this.rect(128,479,345,244,14,'#f5d4b0');this.rect(144,499,313,177,5,'#325e7a');
    for(let i=0;i<3;i++){
      const glass=c.createLinearGradient(0,510,0,659);glass.addColorStop(0,'#67bac8');glass.addColorStop(1,'#356b88');
      this.rect(154+i*101,509,90,157,6,glass);this.polygon([{x:158+i*101,y:513},{x:191+i*101,y:513},{x:164+i*101,y:662},{x:158+i*101,y:662}],'#c1f1e330');
    }
    this.rect(112,674,379,22,5,'#dd9a7d');this.rect(132,696,15,41,4,'#9d6f70');this.rect(455,696,15,41,4,'#9d6f70');
    this.rect(112,481,20,256,6,'#ffe6ba');this.rect(469,481,20,256,6,'#f7d9b3');
    this.polygon([{x:92,y:495},{x:128,y:434},{x:471,y:434},{x:509,y:495}],'#337685','#86d1c3',3);this.rect(96,487,410,16,7,'#275466');
    this.rect(199,439,206,50,10,'#263e5b','#e4b07f');this.text('한입 야시장',302,462,27,'#ffe7b8');this.text('NIGHT MARKET',302,481,8,accent);
    this.rect(102,718,390,16,6,'#b6837b');
    for(const [x,color,id] of [[202,'red',1],[303,'yellow',2],[407,'cyan',3]])this.person(x,786,color,reduced?0:time,3.15,false,makePassenger(id));
    // A small station sign makes the transport purpose explicit.
    this.rect(56,554,7,172,2,'#494a66');this.ellipse(60,544,31,31,'#ffe5b4');this.ellipse(60,544,25,25,'#487f8f');this.text('BUS',60,544,13,'#fff1d0');
  }
}
