import {districtFor,DISTRICTS} from './campaign.js?v=57';

const STATION_SIGN_BACKGROUND='#eefaf3';

// Environmental colors never replace the passenger/vehicle matching palette.
export const DISTRICT_STYLES=[
 {motif:'lantern',sky:'#bce5f4',horizon:'#e9f4e2',deep:'#d5e6eb',platform:'#c9dedb',edge:'#73a9a7',road:'#97b4c4',lotTop:'#d7e5ee',lotBottom:'#becfdf',accent:'#ffc780',building:'#85b9bf'},
 {motif:'river',sky:'#b4e5f7',horizon:'#d8f4ee',deep:'#d9eaf0',platform:'#c7e4dc',edge:'#6facb6',road:'#94b9ca',lotTop:'#dceaf0',lotBottom:'#bfd7e1',accent:'#ffe3a1',building:'#85c7ce'},
 {motif:'harbor',sky:'#bee5fa',horizon:'#e9f6fb',deep:'#dce7f1',platform:'#c9dfe9',edge:'#7aaac4',road:'#98b5cb',lotTop:'#dce6f0',lotBottom:'#c0d2e2',accent:'#ffe2aa',building:'#8fbed8'},
 {motif:'sakura',sky:'#eddaef',horizon:'#fff0ed',deep:'#e7e3ec',platform:'#efdce4',edge:'#bb93b2',road:'#b2acbf',lotTop:'#eee6eb',lotBottom:'#d8cadb',accent:'#ffb5c7',building:'#d0b4d0'},
 {motif:'hills',sky:'#ffe0be',horizon:'#fff1d5',deep:'#eae5d9',platform:'#e7dbc3',edge:'#c0aa7d',road:'#beb7a2',lotTop:'#ebe8df',lotBottom:'#d3d4cb',accent:'#ffc083',building:'#d9bf99'},
 {motif:'galaxy',sky:'#dcd7fb',horizon:'#edeafb',deep:'#e1e4ef',platform:'#dbd7ed',edge:'#a89ccc',road:'#aeaeca',lotTop:'#e7e7f3',lotBottom:'#cbcde2',accent:'#ffc9bd',building:'#b9b0df'},
 {motif:'forest',sky:'#cceadf',horizon:'#e8f5d5',deep:'#dce8de',platform:'#d1e4cd',edge:'#89b094',road:'#a2baa9',lotTop:'#e4ece3',lotBottom:'#c5d8ca',accent:'#ffe19a',building:'#99c4ab'},
 {motif:'bridge',sky:'#d8e7ff',horizon:'#ffeadf',deep:'#e5e8f1',platform:'#dfdfed',edge:'#aaa6c8',road:'#acb9ce',lotTop:'#e6e9f1',lotBottom:'#cad3e2',accent:'#ffd3a7',building:'#b7badb'},
 {motif:'terminal',sky:'#c8e6ef',horizon:'#e6f4f5',deep:'#dce6ec',platform:'#d5e4e4',edge:'#8aafbb',road:'#9eB8c6',lotTop:'#e0e9ed',lotBottom:'#c6d5dd',accent:'#ffe4aa',building:'#a0c7d0'},
 {motif:'festival',sky:'#ffe1e7',horizon:'#fff1d7',deep:'#e9e3ee',platform:'#ecdce6',edge:'#c3a0b6',road:'#b4adc4',lotTop:'#ece7ef',lotBottom:'#d7cce1',accent:'#ffc59d',building:'#d6b3c7'}
];
const newSkies=['#ffecd1','#e3d6f5','#daf0df','#b5e7fa','#e1ecfb','#d2d9fa','#ffe6b8','#c7efe6','#e8d9f2','#ffe0ea'];
DISTRICT_STYLES.push(...DISTRICT_STYLES.map((s,i)=>({...s,sky:newSkies[i],horizon:i%2?'#fff0e7':'#f2f9e9',accent:DISTRICTS[i+10].color})));
export function districtStyle(index){return DISTRICT_STYLES[districtFor(Math.max(0,Math.min(199,index)))];}
export function districtLabel(index){return DISTRICTS[districtFor(index)].name;}

export function districtSky(s,p){
 const c=s.c;
 for(let i=0;i<13;i++){
  const x=i*51,h=22+(i*31)%45;s.rect(x,130-h,44,h,3,p.building);
  for(let j=0;j<3;j++)s.rect(x+8+j*10,140-h,4,6,1,p.accent+'60');
 }
 const line=(pts,color=p.accent,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const tree=(x,y,color)=>{s.rect(x-3,y-15,6,45,2,p.edge);s.ellipse(x,y-18,25,24,color);s.ellipse(x-17,y-9,18,16,color);s.ellipse(x+18,y-7,18,18,color);};
 c.save();
 switch(p.motif){
  case 'lantern':
   for(let i=0;i<5;i++){const x=166+i*62;line([[x,99],[x,123]]);s.rect(x-13,121,26,31,9,p.accent);s.rect(x-3,151,6,8,1,p.edge);line([[x,127],[x,145]],p.edge,1);}
   break;
  case 'river':
   s.rect(112,119,390,54,0,'#89cad8');
   for(let i=0;i<7;i++)line([[130+i*48,143+i%3*7],[154+i*48,143+i%3*7]],'#8fc8cf66');
   c.strokeStyle=p.accent;c.lineWidth=5;c.beginPath();c.moveTo(166,143);c.quadraticCurveTo(295,48,434,143);c.stroke();line([[159,137],[438,137]],p.edge,5);
   for(let i=0;i<7;i++)line([[177+i*38,118-Math.sin(i/6*Math.PI)*19],[177+i*38,136]],p.edge,2);
   break;
  case 'harbor':
   s.rect(114,142,389,30,0,'#9acddd');
   s.rect(210,96,22,59,3,'#dfdecd');s.rect(210,113,22,10,0,'#a36773');s.rect(206,92,30,8,2,p.accent);s.rect(215,83,12,10,2,p.accent);
   line([[362,155],[362,105],[423,105]],p.edge,5);line([[416,105],[416,135]],p.accent);
   line([[281,159],[298,170],[335,170],[345,159]],p.accent,4);line([[312,159],[312,118],[341,153],[312,153]],p.accent,2);
   break;
  case 'sakura':
   for(const x of [146,227,384,459])tree(x,140,'#e1a8c5');
   for(let i=0;i<18;i++)s.ellipse(133+i*20,151+(i*7)%20,3,1.5,p.accent);
   break;
  case 'hills':
   s.ellipse(372,119,30,30,'#e7b691');
   c.fillStyle='#adc69f';c.beginPath();c.moveTo(111,172);c.lineTo(190,103);c.lineTo(273,172);c.lineTo(341,124);c.lineTo(456,172);c.fill();
   line([[123,154],[468,105]],p.edge,2);for(const x of [250,399]){const y=154-(x-123)*49/345;line([[x,y],[x,y+10]],p.accent);s.rect(x-13,y+10,26,21,5,p.accent);s.rect(x-8,y+13,16,8,2,p.sky);}
   break;
  case 'galaxy':
   for(let i=0;i<30;i++){const x=120+(i*71)%380,y=100+(i*13)%64;s.ellipse(x,y,i%5===0?2.5:1,1.5,p.accent);}
   s.ellipse(326,128,37,26,'#9285ba');c.save();c.translate(326,128);c.rotate(-.3);c.strokeStyle=p.accent;c.lineWidth=3;c.beginPath();c.ellipse(0,0,58,10,0,0,Math.PI*2);c.stroke();c.restore();
   line([[153,124],[182,112],[205,140],[244,122]],p.accent+'90',1);
   break;
  case 'forest':
   for(const x of [128,184,245,357,416,473])tree(x,140,x%2?'#98c593':'#7eaf91');
   for(let i=0;i<24;i++){const x=123+(i*83)%370,y=113+(i*29)%55;s.ellipse(x,y,2.3,2.3,p.accent);}
   break;
  case 'bridge':
   for(let i=0;i<5;i++){c.strokeStyle=['#d3a8b9','#d5bb98','#adc5ae','#9fbfd0','#b8acd5'][i];c.lineWidth=5;c.beginPath();c.ellipse(306,172,150-i*7,65-i*7,0,Math.PI,Math.PI*2);c.stroke();}
   line([[139,170],[471,170]],p.edge,5);for(const x of [159,451]){s.rect(x-5,114,10,58,2,p.edge);s.ellipse(x,109,7,7,p.accent);}
   break;
  case 'terminal':
   s.rect(148,112,320,60,8,p.building,p.edge);s.rect(140,103,336,14,4,p.edge);
   for(let i=0;i<8;i++)s.rect(162+i*38,131,23,30,3,'#739cac');s.ellipse(310,108,18,18,p.accent);line([[310,96],[310,108],[320,114]],p.sky,2);
   break;
  case 'festival':
   for(let n=0;n<3;n++){const x=173+n*140,y=121+(n%2)*10;for(let i=0;i<10;i++){const a=i*Math.PI/5;line([[x+Math.cos(a)*12,y+Math.sin(a)*12],[x+Math.cos(a)*27,y+Math.sin(a)*27]],n%2?'#ead5f3':p.accent,2);}}
   for(let i=0;i<9;i++){const x=120+i*45;line([[x,159],[x+45,159]],p.edge);c.fillStyle=i%2?'#d2a6b3':'#e9cda0';c.beginPath();c.moveTo(x,159);c.lineTo(x+22,178);c.lineTo(x+43,159);c.fill();}
   break;
 }
 c.restore();
}

export function districtStop(s,p,index){
 // A solid station fascia below the landmark, above the passenger queue.
 s.rect(112,161,391,17,5,STATION_SIGN_BACKGROUND,p.edge);
 s.text(`${districtLabel(index)} 정류장`,308,169,11,p.accent);
 // Border ornaments remain outside the active vehicle area.
 for(const x of [9,591])for(let i=0;i<5;i++)s.ellipse(x,459+i*96,2.5,6,p.accent+'99');
}
