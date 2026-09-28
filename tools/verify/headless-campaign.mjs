// v60 검증 1단계: 브라우저 없이 실제 게임 엔진(Market/Traffic)으로 200단계를 자동 플레이한다.
// 봇 방식(기본 --order=solution): 사람처럼 "모든 움직임이 끝난 뒤" 한 대씩 배차하고, 패배하면 게임의 되돌리기(undo)로
// 한 수 물러나 다른 차량을 시도하는 깊이 우선 탐색(DFS). 후보 우선순위는 검증된 탈출 순서.
// (--order=color: ①맨 앞 손님 색과 같은 차 ②곧 필요한 색 ③탈출 순서 — 비교용)
// 결과 판정: won = 클리어 경로 발견 / unsolved = 탐색 한도 내 경로 없음 / error = 엔진 예외.
// 사용법: node tools/verify/headless-campaign.mjs [시작단계=1] [끝단계=200] [--accept-cut] [--budget=N]
import {Market} from '../../market.js?v=60';
import {canExit} from '../../game.js?v=60';
import {hiddenCar} from '../../puzzle.js?v=60';
import {chooseQueueCut} from '../../queue-cut.js?v=60';
import {timeTargets} from '../../timing.js?v=60';
import {TOTAL_LEVELS} from '../../campaign.js?v=60';

const args=process.argv.slice(2),acceptCut=args.includes('--accept-cut');
const order=(args.find(a=>a.startsWith('--order='))?.split('=')[1])||'solution';
const budget=Number(args.find(a=>a.startsWith('--budget='))?.split('=')[1]||4000);
const nums=args.filter(a=>/^\d+$/.test(a)).map(Number);
const from=nums[0]??1,to=nums[1]??TOTAL_LEVELS;
const DT=0.05;
// traffic.js는 연기 효과에만 Math.random을 쓴다. 재현성을 위해 고정한다.
let seed=1;Math.random=()=>((seed=(seed*16807)%2147483647)/2147483647);

const busy=t=>t.running.length||t.walkers.length||t.arriving.length||t.state.queueCut?.status==='entering';
// 움직임이 모두 끝날 때까지 진행. 차고 입차는 정지 직후 시작되므로 몇 틱 더 확인한다.
function settle(t,clock){
  let quiet=0;
  for(let n=0;n<20000;n++){
    if(t.state.queueCut?.status==='offered')chooseQueueCut(t,acceptCut);
    // 승패가 나도 움직이는 차량이 멈출 때까지 진행해야 되돌리기가 가능하다.
    if(busy(t))quiet=0;else if(t.state.status!=='playing'||++quiet>4)return;
    t.tick(DT);clock.sec+=DT;
  }
  throw Error('settle timeout');
}
function candidates(t){
  const s=t.state,rank=new Map(t.solution.map((id,i)=>[id,i]));
  const soon=s.queue.slice(0,12);
  const list=s.cars.filter(c=>canExit(s,c)&&!hiddenCar(c));
  if(order==='solution')return list.sort((a,b)=>(rank.get(a.id)??999)-(rank.get(b.id)??999));
  return list.sort((a,b)=>{
    const fa=a.color===s.queue[0]?0:1,fb=b.color===s.queue[0]?0:1;if(fa!==fb)return fa-fb;
    const sa=soon.indexOf(a.color),sb=soon.indexOf(b.color);const xa=sa<0?99:sa,xb=sb<0?99:sb;if(xa!==xb)return xa-xb;
    return (rank.get(a.id)??999)-(rank.get(b.id)??999);
  });
}
function play(index){
  const t=new Market(index),s=t.state,clock={sec:0};
  const info={stage:index+1,status:'',moves:0,nodes:0,backtracks:0,seconds:0,gates:s.puzzle?.gates.length||0,covered:s.puzzle?.covered.length||0,
    garage:!!s.garage,emergency:'-',queueCut:'-',passengers:t.total,threeStar:timeTargets(index).three,error:''};
  try{
    settle(t,clock);
    const dfs=()=>{
      if(t.state.status==='won')return true;
      if(t.state.status==='lost')return false;
      for(const car of candidates(t)){
        if(info.nodes>=budget)return false;
        const r=t.dispatch(car.id);if(!r.ok)continue;info.nodes++;
        settle(t,clock);
        if(dfs())return true;
        if(!t.undo())throw Error(`undo 실패(stack=${t.undoStack.length},cut=${t.state.queueCut?.status},running=${t.running.length},walkers=${t.walkers.length},arriving=${t.arriving.length})`);info.backtracks++;t.state.status='playing';settle(t,clock);
      }
      return false;
    };
    const ok=dfs();
    info.status=ok?'won':'unsolved';
  }catch(e){info.status='error';info.error=String(e?.message||e);}
  const st=t.state;
  info.moves=st.moves;info.seconds=Math.round(clock.sec*10)/10;
  info.emergency=st.emergency?.status||'-';info.queueCut=st.queueCut?.status||'-';
  info.leftCars=st.cars.length;info.leftQueue=st.queue.length;
  return info;
}

const rows=[];const t0=Date.now();
for(let i=from-1;i<to;i++){const r=play(i);rows.push(r);
  if(r.status!=='won')console.error(`[미해결] ${r.stage}단계 ${r.status} ${r.error} 탐색=${r.nodes} 남은차량=${r.leftCars} 남은승객=${r.leftQueue}`);}
const sum=k=>rows.filter(r=>r.status===k).length;
const out={version:'v60',acceptCut,budget,range:[from,to],elapsedMs:Date.now()-t0,
  counts:{total:rows.length,won:sum('won'),unsolved:sum('unsolved'),error:sum('error')},rows};
console.log(JSON.stringify(out));
