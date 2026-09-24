import {districtFor,DISTRICTS} from './campaign.js?v=32';

const STATION_SIGN_BACKGROUND='#253047';

// Environmental colors never replace the passenger/vehicle matching palette.
export const DISTRICT_STYLES=[
 {motif:'lantern',sky:'#171b35',horizon:'#453445',deep:'#252237',platform:'#65535d',edge:'#b99678',road:'#272b39',lotTop:'#716776',lotBottom:'#565260',accent:'#ffd49a',building:'#32314c'},
 {motif:'river',sky:'#102c40',horizon:'#255666',deep:'#193643',platform:'#4c6570',edge:'#8cbbb8',road:'#213844',lotTop:'#667781',lotBottom:'#4e626e',accent:'#b4ecdf',building:'#234454'},
 {motif:'harbor',sky:'#172d4d',horizon:'#3b5779',deep:'#202f46',platform:'#586c81',edge:'#a0b8cb',road:'#233345',lotTop:'#707787',lotBottom:'#575e70',accent:'#d6e7ff',building:'#2a4263'},
 {motif:'sakura',sky:'#30203f',horizon:'#694457',deep:'#372637',platform:'#765c6c',edge:'#c99fad',road:'#382a3d',lotTop:'#83727d',lotBottom:'#645763',accent:'#ffd6e3',building:'#49374f'},
 {motif:'hills',sky:'#402941',horizon:'#965f58',deep:'#412e39',platform:'#806b67',edge:'#d1ad8c',road:'#3b3038',lotTop:'#83776f',lotBottom:'#685d5c',accent:'#ffe0b2',building:'#684c55'},
 {motif:'galaxy',sky:'#181735',horizon:'#3e3460',deep:'#24213e',platform:'#625b78',edge:'#aea1cc',road:'#28263c',lotTop:'#756f85',lotBottom:'#5b576d',accent:'#ded1ff',building:'#302b4f'},
 {motif:'forest',sky:'#142c30',horizon:'#30584c',deep:'#1e3731',platform:'#526e61',edge:'#a4b8a0',road:'#273b35',lotTop:'#718077',lotBottom:'#54655c',accent:'#e1f2be',building:'#24443b'},
 {motif:'bridge',sky:'#242441',horizon:'#545173',deep:'#2a2c43',platform:'#66677e',edge:'#b7b5cd',road:'#2c3144',lotTop:'#777d8d',lotBottom:'#5c6176',accent:'#f2dfff',building:'#393c59'},
 {motif:'terminal',sky:'#131e32',horizon:'#344354',deep:'#212b39',platform:'#536877',edge:'#9eb7c5',road:'#202f3a',lotTop:'#657382',lotBottom:'#4a596b',accent:'#c5eafa',building:'#283749'},
 {motif:'festival',sky:'#353150',horizon:'#947385',deep:'#493b53',platform:'#7f6c81',edge:'#dbc2ad',road:'#3b354b',lotTop:'#827b8a',lotBottom:'#665f72',accent:'#fff0cc',building:'#60506b'}
];
export function districtStyle(index){return DISTRICT_STYLES[districtFor(Math.max(0,Math.min(99,index)))];}
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
   s.rect(112,119,390,54,0,'#326c7a');
   for(let i=0;i<7;i++)line([[130+i*48,143+i%3*7],[154+i*48,143+i%3*7]],'#8fc8cf66');
   c.strokeStyle=p.accent;c.lineWidth=5;c.beginPath();c.moveTo(166,143);c.quadraticCurveTo(295,48,434,143);c.stroke();line([[159,137],[438,137]],p.edge,5);
   for(let i=0;i<7;i++)line([[177+i*38,118-Math.sin(i/6*Math.PI)*19],[177+i*38,136]],p.edge,2);
   break;
  case 'harbor':
   s.rect(114,142,389,30,0,'#385e7c');
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
   c.fillStyle='#6d5663';c.beginPath();c.moveTo(111,172);c.lineTo(190,103);c.lineTo(273,172);c.lineTo(341,124);c.lineTo(456,172);c.fill();
   line([[123,154],[468,105]],p.edge,2);for(const x of [250,399]){const y=154-(x-123)*49/345;line([[x,y],[x,y+10]],p.accent);s.rect(x-13,y+10,26,21,5,p.accent);s.rect(x-8,y+13,16,8,2,p.sky);}
   break;
  case 'galaxy':
   for(let i=0;i<30;i++){const x=120+(i*71)%380,y=100+(i*13)%64;s.ellipse(x,y,i%5===0?2.5:1,1.5,p.accent);}
   s.ellipse(326,128,37,26,'#9285ba');c.save();c.translate(326,128);c.rotate(-.3);c.strokeStyle=p.accent;c.lineWidth=3;c.beginPath();c.ellipse(0,0,58,10,0,0,Math.PI*2);c.stroke();c.restore();
   line([[153,124],[182,112],[205,140],[244,122]],p.accent+'90',1);
   break;
  case 'forest':
   for(const x of [128,184,245,357,416,473])tree(x,140,x%2?'#4b7662':'#3e6656');
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
