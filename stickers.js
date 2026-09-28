import {DISTRICTS,LEVELS_PER_DISTRICT} from './campaign.js?v=61';
export const STICKERS=[
 ...DISTRICTS.map((d,i)=>({id:`district-${i+1}`,name:d.name,icon:d.icon,color:d.color,condition:`${i*10+1}–${i*10+10}단계 모두 완료`,earned:s=>Array.from({length:LEVELS_PER_DISTRICT},(_,n)=>i*10+n).every(n=>s.cleared?.includes(n))})),
 {id:'attendance-7',name:'초롱이의 약속',icon:'🐾',color:'#ffcbaa',condition:'7일 연속 출석하고 보상 받기',earned:s=>(s.streak?.count>=7&&s.streak?.claimed)||s.streak?.count>7},
 ...[50,100,200].map(n=>({id:`stars-${n}`,name:`별빛 기사 ${n}`,icon:'★',color:'#ffe3a0',condition:`별 3개로 누적 ${n}회 완료`,earned:s=>s.threeStarRuns>=n})),
 {id:'combo-7',name:'일곱 빛 퍼레이드',icon:'🌈',color:'#bfe9de',condition:'만차 출발 7콤보 달성',earned:(s,liveCombo)=>liveCombo>=7||Object.values(s.comboBest||{}).some(n=>Number.isInteger(n)&&n>=7)}
];
const IDS=new Set(STICKERS.map(s=>s.id));
export const normalizeStickers=value=>[...new Set((Array.isArray(value)?value:[]).filter(id=>IDS.has(id)))];
// Cosmetic awards only. Never grants coins, items or extra gameplay power.
export function awardStickers(save,liveCombo=0){
 save.stickers=normalizeStickers(save.stickers);
 const added=STICKERS.filter(s=>!save.stickers.includes(s.id)&&s.earned(save,liveCombo)).map(s=>s.id);
 save.stickers.push(...added);return added;
}
export function stickerCollection(save){
 const owned=new Set(normalizeStickers(save.stickers));
 return `<section class="sticker-collection" aria-labelledby="stickers-title"><div class="collection-heading"><div><small>작은 밤의 기념품</small><h2 id="stickers-title">나의 스티커 도감</h2></div><b>${owned.size}<small> / ${STICKERS.length}</small></b></div><p>지나온 골목과 반짝이는 순간을 모아 보세요.</p><div class="sticker-grid">${STICKERS.map(s=>{const has=owned.has(s.id);return `<article class="sticker-card ${has?'owned':'locked'}" aria-label="${s.name}, ${has?'획득':'잠김'}, ${s.condition}"><span class="sticker-seal" style="--sticker-color:${s.color}"><span aria-hidden="true">${s.icon}</span>${has?'<i aria-hidden="true">✓</i>':'<i aria-hidden="true">♙</i>'}</span><b>${s.name}</b><small>${s.condition}</small><em>${has?'획득 완료':'아직 잠겨 있어요'}</em></article>`;}).join('')}</div><p class="collection-note">스티커는 코인을 사용하지 않는 기념 보상이에요.<br>이 기기의 운행 기록과 함께 보관됩니다.</p></section>`;
}
