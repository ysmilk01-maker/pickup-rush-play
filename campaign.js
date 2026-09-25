export const TOTAL_LEVELS=200;
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
 {name:'백야 축제',subtitle:'축제의 끝에서 새로운 여행으로',icon:'🎆',color:'#ffcf94'},
 {name:'아침빛 수변',subtitle:'햇살을 따라 다시 출발해요',icon:'🌅',color:'#ffd5a0'},
 {name:'라벤더 마을',subtitle:'보랏빛 골목의 작은 약속',icon:'🪻',color:'#c7b1f0'},
 {name:'산들바람 언덕',subtitle:'긴 셔틀과 굽은 길의 만남',icon:'🍃',color:'#b4dec5'},
 {name:'푸른 바다 시장',subtitle:'파도 소리 가득한 환승',icon:'🌊',color:'#a0dce9'},
 {name:'구름 위 정원',subtitle:'하늘 가까이 이어지는 길',icon:'☁️',color:'#d4ddf5'},
 {name:'별똥별 거리',subtitle:'빠른 판단이 빛나는 밤',icon:'🌠',color:'#c2c0f4'},
 {name:'황금빛 항구',subtitle:'마지막 배를 기다리는 손님',icon:'⚓',color:'#f6ce94'},
 {name:'오로라 광장',subtitle:'일곱 빛깔이 모이는 정류장',icon:'🌈',color:'#b0e6d5'},
 {name:'달맞이 고개',subtitle:'200번째 밤을 앞둔 긴 여정',icon:'🌕',color:'#e6d1f1'},
 {name:'빛의 카니발',subtitle:'모두 함께 떠나는 200번째 밤',icon:'🎪',color:'#ffbdcc'}
];

export function stageProfile(index,version=7){
 const i=Math.max(0,Math.min(TOTAL_LEVELS-1,Math.trunc(index)||0));
 const count=i<100?40+Math.floor(i/12):48+Math.floor((i-100)/12),buses=i<100?6+Math.floor(i/20):11+Math.floor((i-100)/22),vans=20+Math.floor((count-40)/2);
 return {index:i,number:i+1,district:Math.floor(i/LEVELS_PER_DISTRICT),
  count,colors:i<10?4:i<25?5:i<50?6:7,buses,vans,taxis:count-buses-vans,
  // Demand rises within each district, recovers after its challenge, and grows across districts.
  rhythm:i%10===9?'도전 운행':i%10===0?'새 골목 적응':'골목 운행',
  pressure:i>=100?Math.min(4,3.4+.3*(i-100)/99+.3*(i%10)/9):version<7?2+2*i/99:Math.min(4,2+1.35*i/99+.65*(i%10)/9),maxBatch:i<30?3:i<65?2:1,
  scale:i<100?1-(count-40)*.013:.85-(count-48)*.012,difficulty:i+1,seed:101+i*211};
}
export const districtFor=index=>Math.floor(index/LEVELS_PER_DISTRICT);
