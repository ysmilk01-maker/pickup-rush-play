export const TOTAL_LEVELS=100;
export const LEVELS_PER_DISTRICT=10;
export const DISTRICTS=[
 {name:'등불 골목',subtitle:'첫 셔틀이 출발하는 저녁',icon:'🏮',color:'#ffbd79'},
 {name:'달빛 강변',subtitle:'강바람을 따라 이어지는 운행',icon:'🌙',color:'#83ded9'},
 {name:'별빛 항구',subtitle:'큰 셔틀이 드나드는 부두',icon:'✨',color:'#c4b1ff'},
 {name:'벚꽃 거리',subtitle:'꽃잎 아래 손님들의 밤산책',icon:'🌸',color:'#ffb4d1'},
 {name:'노을 언덕',subtitle:'서로 얽힌 길을 천천히 풀어요',icon:'🌇',color:'#f6aa8a'},
 {name:'은하 광장',subtitle:'별빛 아래 셔틀이 만나는 곳',icon:'🌌',color:'#a9adff'},
 {name:'반딧불 숲',subtitle:'한 명씩 이어지는 작은 발걸음',icon:'🌿',color:'#a7dca5'},
 {name:'무지개 다리',subtitle:'일곱 빛깔의 복잡한 환승',icon:'🌈',color:'#9cddeb'},
 {name:'심야 터미널',subtitle:'긴 버스와 짧은 줄 사이의 선택',icon:'🌃',color:'#b6b5e5'},
 {name:'백야 축제',subtitle:'100번째 밤을 향한 마지막 운행',icon:'🎆',color:'#ffcf94'}
];

export function stageProfile(index){
 const i=Math.max(0,Math.min(TOTAL_LEVELS-1,Math.trunc(index)||0));
 const count=40+Math.floor(i/12),buses=6+Math.floor(i/20),vans=20+Math.floor((count-40)/2);
 return {index:i,number:i+1,district:Math.floor(i/LEVELS_PER_DISTRICT),
  count,colors:i<10?4:i<25?5:i<50?6:7,buses,vans,taxis:count-buses-vans,
  // Average simultaneous demand grows continuously from two to four cars.
  pressure:2+2*i/99,maxBatch:i<30?3:i<65?2:1,
  scale:1-(count-40)*.013,difficulty:i+1,seed:101+i*211};
}
export const districtFor=index=>Math.floor(index/LEVELS_PER_DISTRICT);
