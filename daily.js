// Daily missions and attendance streak. Progress is counted from a snapshot of the
// lifetime counters taken on the first visit of each local day, so replays count too.
export const DAILY_GROUPS=[
 [{id:'clear2',name:'오늘의 운행',description:'단계 2번 완료',target:2,reward:30,stat:'wins'},
  {id:'clear4',name:'부지런한 기사님',description:'단계 4번 완료',target:4,reward:60,stat:'wins'}],
 [{id:'board300',name:'북적이는 저녁',description:'손님 300명 태우기',target:300,reward:30,stat:'boarded'},
  {id:'board800',name:'만원 셔틀',description:'손님 800명 태우기',target:800,reward:60,stat:'boarded'}],
 [{id:'star1',name:'반짝이는 운행',description:'별 3개로 1번 완료',target:1,reward:40,stat:'threeStarRuns'},
  {id:'star3',name:'별빛 수집가',description:'별 3개로 3번 완료',target:3,reward:80,stat:'threeStarRuns'}]
];
export const DAILY_IDS=DAILY_GROUPS.flat().map(m=>m.id);
export const STATS=['wins','boarded','threeStarRuns'];
export const DAY_PATTERN=/^\d{4}-\d{2}-\d{2}$/;
const pad=n=>String(n).padStart(2,'0');
export const dayKey=(date=new Date())=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const dayNumber=key=>{const [y,m,d]=key.split('-').map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5);};
// Day 1 pays 20 coins, rising by 10 each consecutive day up to 80 from day 7.
export const streakReward=count=>20+10*Math.min(6,Math.max(0,count-1));

export function missionsFor(key){
 const n=dayNumber(key);
 return DAILY_GROUPS.map((group,i)=>group[(n+i)%group.length]);
}
// Starts a new day when needed. Returns true when the save changed.
export function refreshDaily(save,now=new Date()){
 const key=dayKey(now);
 if(save.daily?.date===key)return false;
 const last=save.streak?.last||'';
 const count=last&&DAY_PATTERN.test(last)&&dayNumber(key)-dayNumber(last)===1?(save.streak.count||0)+1:1;
 save.streak={last:key,count,claimed:false};
 save.daily={date:key,base:Object.fromEntries(STATS.map(k=>[k,save[k]||0])),claimed:[]};
 return true;
}
export function dailyProgress(save){
 if(!save.daily)return [];
 return missionsFor(save.daily.date).map(m=>{
  const value=Math.max(0,Math.min(m.target,(save[m.stat]||0)-(save.daily.base[m.stat]||0)));
  return {...m,value,claimed:save.daily.claimed.includes(m.id),ready:value>=m.target&&!save.daily.claimed.includes(m.id)};
 });
}
export function claimDaily(save,id){
 const mission=dailyProgress(save).find(m=>m.id===id);
 if(!mission?.ready)return 0;
 save.daily.claimed.push(id);save.coins+=mission.reward;return mission.reward;
}
export function claimStreak(save){
 if(!save.streak||save.streak.claimed||save.streak.last!==save.daily?.date)return 0;
 const reward=streakReward(save.streak.count);save.streak.claimed=true;save.coins+=reward;return reward;
}
export const dailyReady=save=>!!save.streak&&!save.streak.claimed||dailyProgress(save).some(m=>m.ready);
// Reject malformed or edited values while keeping a valid day intact.
export function normalizeDaily(raw){
 const int=v=>Number.isInteger(v)&&v>=0?Math.min(v,9999999):0;
 const daily=raw?.daily&&DAY_PATTERN.test(raw.daily.date)?{date:raw.daily.date,base:Object.fromEntries(STATS.map(k=>[k,int(raw.daily.base?.[k])])),
  claimed:(Array.isArray(raw.daily.claimed)?raw.daily.claimed:[]).filter((id,i,a)=>DAILY_IDS.includes(id)&&a.indexOf(id)===i)}:null;
 const streak=raw?.streak&&DAY_PATTERN.test(raw.streak.last)?{last:raw.streak.last,count:Math.max(1,Math.min(9999,int(raw.streak.count))),claimed:raw.streak.claimed===true}:null;
 return {daily,streak};
}
