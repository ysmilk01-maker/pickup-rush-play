import { Traffic, carPose, BAY } from './traffic.js?v=13';
import { vehicleModel } from './appearance.js?v=13';
import { Scene } from './scene.js?v=13';
import { LEVELS, COLORS, VEHICLE_TYPES, canExit } from './game.js?v=13';
import { platform } from './platform.js?v=13';
const $=s=>document.querySelector(s),canvas=$('#scene'),scene=new Scene(canvas);
let traffic=new Traffic(Math.min(11,platform.loadProgress())),coins=platform.loadCoins(),last=0,selected=null,toastUntil=0,finished=false,modalMode='',adBusy=false,sorts=1;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
$('#coin-count').textContent=coins;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=performance.now()+1900;}
function targets(){
 const holder=$('#car-targets');holder.replaceChildren();
 for(const car of traffic.state.cars){const p=carPose(car,traffic.state),b=document.createElement('button');b.className='car-target';b.dataset.carId=car.id;b.style.cssText=`left:${(p.x-20)/6}%;top:${(p.y-25)/10.8}%;width:7%;height:4%`;b.setAttribute('aria-label',`${COLORS[car.color].label} ${vehicleModel(car).label}, ${car.dir} 방향, ${canExit(traffic.state,car)?'이동 가능':'길 막힘'}`);b.onclick=()=>dispatch(car.id);holder.append(b);}
 $('#locked-targets').replaceChildren();for(let i=traffic.state.bays.length;i<7;i++){const b=document.createElement('button');b.className='locked-target';b.style.left=`${(BAY(i).x-30)/6}%`;b.setAttribute('aria-label',`광고 보고 정류장 ${i+1}번 칸 열기`);b.onclick=reward;$('#locked-targets').append(b);}
 $('#ad').disabled=traffic.state.bays.length>=7;$('#sort-count').textContent=sorts;
}
function dispatch(id){if(adBusy)return;const result=traffic.dispatch(id);if(!result.ok){toast(result.reason==='blocked'?'앞 차량을 먼저 빼주세요':'주차 공간이 가득 찼습니다');selected={id,until:traffic.time+.25};platform.haptic();return;}platform.haptic();targets();}
canvas.addEventListener('pointerup',e=>{const r=canvas.getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car)dispatch(car.id);});
function open(title,body,button,mode){modalMode=mode;$('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#primary').textContent=button;$('#primary').disabled=false;$('#modal').hidden=false;$('#primary').focus();}
function close(){if(adBusy)return;$('#modal').hidden=true;modalMode='';$('#settings').focus();}
function load(index){traffic=new Traffic(index);sorts=1;finished=false;selected=null;targets();close();}
$('#close').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
$('#settings').onclick=()=>{open('픽업 러시',`<p>화살표 앞이 열린 차량을 보내세요.<br>같은 색 승객이 타고, 만차가 되면 출발합니다.</p><select id="level-picker" aria-label="스테이지 선택">${LEVELS.map((l,i)=>`<option value="${i}" ${i===traffic.state.levelIndex?'selected':''}>레벨 ${i+1} · ${l.title}</option>`).join('')}</select><div class="settings-row"><span>승용차·택시 4석 / SUV·봉고차 6석 / 버스 10석</span></div>`,'선택한 레벨 시작','settings');};
$('#primary').onclick=()=>{if(modalMode==='settings')load(Number($('#level-picker').value));else if(modalMode==='win')load((traffic.state.levelIndex+1)%12);else if(modalMode==='lost'){if(traffic.state.bays.length<7)reward();else load(traffic.state.levelIndex);}else close();};
$('#undo').onclick=()=>{if(traffic.undo()){finished=false;targets();toast('이전 배치로 돌아왔습니다');}else toast('이동과 탑승이 끝난 뒤 되돌릴 수 있어요');};
$('#sort').onclick=()=>{if(!sorts){toast('이번 레벨의 정렬을 사용했습니다');return;}if(traffic.walkers.length){toast('승객 탑승이 끝난 뒤 사용해 주세요');return;}const parked=traffic.state.bays.find(c=>c?.phase==='parked'&&c.loaded+c.pending<c.capacity);if(!parked){toast('대기 중인 차량이 있을 때 사용할 수 있어요');return;}const color=parked.color;traffic.sortQueue(color);sorts--;traffic.state.status='playing';finished=false;targets();toast('대기 차량과 같은 색 승객을 앞으로 보냈습니다');};
async function reward(){if(adBusy||traffic.state.bays.length>=7)return;open('정류장 한 칸 더',`<p>광고 완료 시 이번 레벨에 한 칸이 추가됩니다.</p><p>웹 프로토타입 · 테스트 광고</p><div class="ad-progress"><div id="ad-progress"></div></div>`,'광고 재생 중…','ad');adBusy=true;$('#primary').disabled=true;$('#close').hidden=true;try{const result=await platform.requestRewardedAd(p=>$('#ad-progress').style.width=`${p*100}%`);if(result.rewarded){traffic.addBay();finished=false;targets();toast(`정류장 ${traffic.state.bays.length}칸으로 확장!`);}else toast('광고를 완료해야 보상을 받을 수 있어요');}catch{toast('광고를 불러오지 못했습니다. 다시 시도해 주세요.');}finally{adBusy=false;$('#close').hidden=false;close();}}
$('#ad').onclick=reward;
let previousCount=traffic.state.cars.length;
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;if($('#modal').hidden&&!document.hidden)traffic.tick(dt);scene.draw(traffic,selected);if(reduced.matches)traffic.puffs=[];
 $('#hint').textContent=`탑승 ${traffic.delivered} / ${traffic.total}명 · 정류장 ${traffic.state.bays.length}/7 · ${traffic.state.moves}수`;
 $('#undo').disabled=!!traffic.running.length||!!traffic.walkers.length||!traffic.undoStack.length;
 if(now>toastUntil)$('#toast').classList.remove('show');
 if(traffic.state.status!=='playing'&&!finished){finished=true;if(traffic.state.status==='won'){coins+=30;platform.saveCoins(coins);platform.saveProgress(Math.min(traffic.state.levelIndex+1,11));$('#coin-count').textContent=coins;open('모두 탑승했어요!',`<p>${traffic.total}명의 승객이 출발했습니다.<br>레벨 ${traffic.state.levelIndex+1} 완료 · 🟡 +30</p>`,'다음 레벨','win');}else open('정류장이 꽉 찼어요',`<p>같은 색 승객을 기다리는 차량으로<br>모든 정류장이 채워졌습니다.</p>`,traffic.state.bays.length<7?'광고 보고 한 칸 더':'다시 도전','lost');}
 requestAnimationFrame(frame);}
window.addEventListener('resize',()=>scene.resize());document.addEventListener('visibilitychange',()=>{last=0;});targets();requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=13').catch(()=>{});
