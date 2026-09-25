import {Market} from './market.js?v=52';
import {MarketScene} from './market-scene.js?v=52';
import {COLORS,canExit} from './game.js?v=52';
import {CAPACITY} from './traffic.js?v=52';
import {pendingCars} from './garage.js?v=52';
import {stageProfile} from './campaign.js?v=52';
import {overlaps,bounds,LOT} from './geometry.js?v=52';
import {exitBlockers,hiddenCar} from './puzzle.js?v=52';
const $=s=>document.querySelector(s),scene=new MarketScene($('#scene')),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let m,auto=false,cursor=0,selection=null,events=[],last=0,custom=false,started=false;
$('#level').innerHTML=Array.from({length:100},(_,i)=>`<option value="${i}">${i+1}단계 · ${stageProfile(i).rhythm}</option>`).join('');
const status=text=>$('#status').textContent=text;
function load(index){
 index=Math.max(0,Math.min(99,index));m=new Market(index);auto=false;started=false;custom=false;cursor=0;selection=null;events=[];
 $('#level').value=index;$('#previous').disabled=index===0;$('#next').disabled=index===99;$('#auto').textContent='해법 재생';
 const p=stageProfile(index);$('#profile').textContent=`${p.count}대 · ${p.colors}색 · ${p.rhythm} · 기본 승강장 4칸`;
 $('#car').innerHTML=m.state.cars.map(c=>`<option value="${c.id}">${c.id} · ${COLORS[c.color].label} ${CAPACITY[c.type]}인승</option>`).join('');
 $('#queue-edit').value=m.state.queue.join(',');$('#triggers').value=m.state.garage?.waves.map(w=>w.trigger).join(',')||'';
 m.onEvent=e=>{if(['board','walk'].includes(e.type))return;events.unshift(`${m.state.moves}배차 · ${{cutin:'새치기 등장',cutSuccess:'새치기 탑승 성공',cutReturn:'새치기 줄 복귀',reveal:'색 공개',gate:'차단기 개방',incoming:'자동 입차',parked:'주차 완료',arrival:'승강장 도착',depart:'만차 출발'}[e.type]||e.type} ${e.gateId||e.carId||''}`);events=events.slice(0,5);};
 editFields();status('단계를 골라 해법을 재생하거나 배치를 실험해 보세요.');render();
}
function editFields(){const car=m.state.cars.find(c=>c.id===$('#car').value);if(!car)return;$('#x').value=car.x.toFixed(1);$('#y').value=car.y.toFixed(1);$('#angle').value=(car.angle*180/Math.PI).toFixed(1);selection={id:car.id,until:m.time+1000};}
function editable(){if(started){status('원본 복원 후 편집하세요. 진행 중인 차량은 편집할 수 없습니다.');return false;}return true;}
function validate(){
 const cars=[...m.state.cars,...pendingCars(m.state)].sort((a,b)=>m.allCars.findIndex(c=>c.id===a.id)-m.allCars.findIndex(c=>c.id===b.id)),issues=[];
 for(let i=0;i<cars.length;i++){const b=bounds(cars[i]);if(b.left<LOT.left||b.right>LOT.right||b.top<LOT.top||b.bottom>LOT.bottom)issues.push(`${cars[i].id}: 주차장 밖`);for(let j=i+1;j<cars.length;j++)if(overlaps(cars[i],cars[j],1))issues.push(`${cars[i].id} ↔ ${cars[j].id}: 겹침`);}
 const s=structuredClone(m.state);s.cars=cars.map(c=>({...c}));const solution=[];
 while(s.cars.length){const car=s.cars.find(c=>canExit(s,c));if(!car){issues.push('차량·열쇠 순환 막힘');break;}solution.push(car.id);s.cars=s.cars.filter(c=>c.id!==car.id);for(const g of s.puzzle?.gates||[])if(g.keyId===car.id)g.open=true;}
 if(!issues.length){m._solution=solution;status('기하·출구 검증 통과. 해법 재생으로 FIFO 대기열과 4칸 완주를 확인하세요.');}else status(issues.slice(0,5).join(' / '));return !issues.length;
}
function nextMove(){
 if(m.busy||m.state.bays.some(c=>c?.phase==='parked'&&c.color===m.state.queue[0]&&c.loaded<c.capacity))return;
 while(cursor<m.solution.length){const id=m.solution[cursor];if(pendingCars(m.state).some(c=>c.id===id))return;if(!m.state.cars.some(c=>c.id===id)){cursor++;continue;}
 const result=m.dispatch(id);if(!result.ok){auto=false;selection={id,until:m.time+1000,blocker:exitBlockers(m.state,m.state.cars.find(c=>c.id===id))[0]};status(`리플레이 중단: ${id} · ${result.reason}. 수정 배치와 승객 순서를 확인하세요.`);}else{cursor++;started=true;status(`${cursor}/${m.solution.length}번째 해법 배차 · ${m.delivered}/${m.total}명 탑승`);}return;}
}
function render(){
 scene.colorAssist=$('#assist').checked;scene.reduceMotion=reduce.matches;scene.draw(m,selection);
 const p=m.state.puzzle;$('#devices').textContent=`가려진 셔틀 ${m.state.cars.filter(hiddenCar).length}/${p.covered.length}대 · 차단기 ${p.gates.filter(g=>g.open).length}/${p.gates.length}개 개방${p.tutorial?' · 새 장치 도입판 (응급차 없음)':''}`;
 $('#queue').innerHTML=m.state.queue.slice(0,32).map(color=>`<i style="--color:${COLORS[color].hex}" title="${COLORS[color].label}">${COLORS[color].short}</i>`).join('');
 $('#garage').textContent=(m.state.garage?.waves||[]).map((w,i)=>`${i+1}차: ${w.trigger}배차 후 · ${w.cars.length}대 남음`).join(' / ')||'차고 없음';$('#events').textContent=events.join('\n');$('#events').style.whiteSpace='pre-line';
}
$('#level').onchange=()=>load(Number($('#level').value));$('#previous').onclick=()=>load(m.state.levelIndex-1);$('#next').onclick=()=>load(m.state.levelIndex+1);$('#reset').onclick=()=>load(m.state.levelIndex);$('#car').onchange=editFields;
$('#auto').onclick=()=>{auto=!auto;$('#auto').textContent=auto?'배차 일시정지':'해법 재생';};$('#step').onclick=()=>{auto=false;$('#auto').textContent='해법 재생';nextMove();};
$('#apply-car').onclick=()=>{if(!editable())return;const car=m.state.cars.find(c=>c.id===$('#car').value),x=Number($('#x').value),y=Number($('#y').value),angle=Number($('#angle').value)*Math.PI/180;if(!car||![x,y,angle].every(Number.isFinite))return;Object.assign(car,{x,y,angle});custom=true;validate();};
$('#apply-queue').onclick=()=>{if(!editable())return;const queue=$('#queue-edit').value.split(',').map(c=>c.trim()).filter(Boolean),totals={};for(const c of [...m.state.cars,...pendingCars(m.state)])totals[c.color]=(totals[c.color]||0)+CAPACITY[c.type];if(queue.some(c=>!COLORS[c])||Object.entries(totals).some(([c,n])=>queue.filter(v=>v===c).length!==n)){status('색상별 승객 수가 차량 좌석 합계와 일치해야 합니다.');return;}m.state.queue=queue;custom=true;status('승객 순서를 적용했습니다. 해법 재생으로 확인하세요.');};
$('#apply-garage').onclick=()=>{if(!editable())return;const waves=m.state.garage?.waves||[],values=$('#triggers').value.split(',').map(Number);if(!waves.length||values.length!==waves.length||values.some((n,i)=>!Number.isInteger(n)||n<0||n>m.allCars.length||i&&n<values[i-1])){status('차고 수만큼 오름차순 배차 수를 입력하세요.');return;}waves.forEach((w,i)=>w.trigger=values[i]);m.garageCheckKey=null;custom=true;status('자동 입차 시점을 적용했습니다.');};
$('#validate').onclick=()=>{if(editable())validate();};
$('#scene').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car){$('#car').value=car.id;editFields();selection.blocker=exitBlockers(m.state,car)[0];}};
$('#export').onclick=()=>{const data={version:1,campaignRules:m.demandVersion,stage:m.state.levelIndex+1,custom,settled:!m.busy,state:m.state,solution:m.solution,delivered:m.delivered};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`night-shuttle-stage-${m.state.levelIndex+1}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('설계 JSON을 저장했습니다. 원본 게임에는 자동 반영되지 않습니다.');};
window.addEventListener('resize',()=>scene.resize());
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!document.hidden){for(let i=0;i<Number($('#speed').value);i++){m.tick(dt);if(auto&&m.state.status==='playing')nextMove();}if(m.state.status!=='playing'){if(auto)status(m.state.status==='won'?`4칸 완주 확인 · ${m.total}명 전원 탑승`:'승강장이 막혔습니다. 배차 순서와 대기열을 확인하세요.');auto=false;$('#auto').textContent='해법 재생';}render();}requestAnimationFrame(frame);}
const query=Number(new URLSearchParams(location.search).get('stage')||1);load(Number.isInteger(query)?query-1:0);requestAnimationFrame(frame);
