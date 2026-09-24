import { Market, CARGO, MARKET_LEVELS } from './market.js?v=19';
import { carPose, BAY, CAPACITY } from './traffic.js?v=19';
import { MarketScene } from './market-scene.js?v=19';
import { canExit, COLORS } from './game.js?v=19';
import { platform } from './platform.js?v=19';
const $=s=>document.querySelector(s),canvas=$('#scene'),scene=new MarketScene(canvas);
const SAVE='night-bite-market-v1';
function readSave(){
  let value={};try{value=JSON.parse(localStorage.getItem(SAVE)||'{}')||{};}catch{}
  return {level:Number.isInteger(value.level)?Math.max(0,Math.min(11,value.level)):0,
    coins:Number.isFinite(value.coins)?Math.max(0,value.coins):60,
    cleared:Array.isArray(value.cleared)?[...new Set(value.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<12))]:[],
    mint:!!value.mint,decoration:value.decoration==='mint'&&value.mint?'mint':'lantern'};
}
let save=readSave(),market=new Market(save.level),last=0,selected=null,toastUntil=0,finished=false,modalMode='',adBusy=false,orderSignature='',returnFocus=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save));}catch{toast('저장 공간을 사용할 수 없어 이번 플레이만 유지됩니다.');}}
function toast(text,duration=2400){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=performance.now()+duration;}
function targets(){
  $('#car-targets').replaceChildren();
  for(const car of market.state.cars){
    const p=carPose(car,market.state),b=document.createElement('button');b.className='car-target';b.dataset.carId=car.id;
    b.style.cssText=`left:${(p.x-20)/6}%;top:${(p.y-25)/10.8}%;width:7%;height:4%`;
    b.setAttribute('aria-label',`${COLORS[car.color].label} ${CARGO[car.color].mark} ${CARGO[car.color].name} 트럭, ${CAPACITY[car.type]}칸, ${car.dir} 방향, ${canExit(market.state,car)?'이동 가능':'길 막힘'}`);
    b.onclick=()=>dispatch(car.id);$('#car-targets').append(b);
  }
  $('#locked-targets').replaceChildren();
  for(let i=market.state.bays.length;i<7;i++){
    const b=document.createElement('button');b.className='locked-target';b.style.left=`${(BAY(i).x-30)/6}%`;
    b.setAttribute('aria-label',`광고 보고 적재장 ${i+1}번 칸 열기`);b.onclick=reward;$('#locked-targets').append(b);
  }
  $('#ad').disabled=market.state.bays.length>=7;orderSignature='';
}
function renderQueue(){
  const color=market.state.queue[0],item=CARGO[color];
  const signature=`${color}:${market.state.queue.length}`;
  if(signature===orderSignature)return;orderSignature=signature;
  $('#queue-summary').textContent=item?`맨 앞 ${item.mark} ${COLORS[color].label} · ${item.name}`:'모든 재료를 실었어요!';
  $('#queue-summary').style.setProperty('--cargo-color',color?COLORS[color].hex:'#fff0cc');
}
function dispatch(id){
  if(adBusy||!$('#modal').hidden)return;const result=market.dispatch(id);
  if(!result.ok){toast(result.reason==='blocked'?'화살표 앞을 막은 트럭부터 꺼내주세요':'적재장이 가득 찼어요. 앞줄 색을 확인하거나 되돌려 보세요.');selected={id,until:market.time+.5};return;}
  platform.haptic();targets();
}
canvas.addEventListener('pointerup',e=>{const r=canvas.getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car)dispatch(car.id);});
function open(title,body,button,mode){
  if($('#modal').hidden)returnFocus=document.activeElement;modalMode=mode;$('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#primary').textContent=button;
  $('#primary').disabled=false;$('#modal').hidden=false;$('#primary').focus();
}
function close(){if(adBusy)return;$('#modal').hidden=true;modalMode='';(returnFocus?.isConnected?returnFocus:$('#settings')).focus({preventScroll:true});}
function load(index){market=new Market(index);finished=false;selected=null;targets();close();platform.emit('market_level_start',{level:index+1});}
function undo(){if(market.undo()){finished=false;targets();close();toast('배차 전으로 돌아왔어요. 다른 트럭부터 꺼내 보세요.');}else toast('주행과 적재가 끝나면 되돌릴 수 있어요');}
$('#close').onclick=close;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')close();
  if(e.key==='Tab'&&!$('#modal').hidden){
    const items=[...$('#modal').querySelectorAll('button:not([disabled]):not([hidden]),select')],first=items[0],end=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}
  }
});
$('#settings').onclick=()=>{
  open('오늘의 영업 준비',`<p>① 줄 맨 앞 재료의 색을 확인해요.<br>② 같은 색 트럭 중 화살표 앞이 열린 트럭을 꺼내요.<br>③ 재료가 줄 순서대로 걸어와 타고, 가득 차면 출발해요!</p><p class="subtle">작은 트럭 4칸 · 중간 트럭 6칸 · 큰 트럭 10칸<br>앞줄과 같은 색 트럭이 없으면 재료는 기다려요.<br>시간제한 없이 길과 적재장 빈칸을 생각해 보세요.</p><select id="level-picker" aria-label="야시장 단계 선택">${MARKET_LEVELS.map((name,i)=>`<option value="${i}" ${i===market.state.levelIndex?'selected':''}>${i+1}일차 · ${name}</option>`).join('')}</select><p class="subtle">기본 적재장 4칸 · 광고 확장 최대 7칸</p>`,'선택한 날 시작','settings');
};
function showTown(){
  open('우리 야시장의 불빛',`<p>${save.cleared.length}/12 가게 오픈 · 한 단계를 끝낼 때마다 새 가게에 불이 켜져요.</p><div class="town">${MARKET_LEVELS.map((name,i)=>`<div class="stall ${save.cleared.includes(i)?'lit':''}"><span>${Object.values(CARGO)[i%6].icon}</span><b>${i+1}호점</b><small>${save.cleared.includes(i)?'영업 중':'오픈 준비'}</small></div>`).join('')}</div><p class="subtle">${save.cleared.length===12?'모든 가게가 열렸어요!':'다음 오픈을 기다리는 이웃들이 있어요.'}</p><button id="decoration" class="secondary">${save.mint?(save.decoration==='mint'?'따뜻한 등불로 바꾸기':'민트 등불로 바꾸기'):'민트 등불 꾸미기 · 60 코인'}</button>`,market.state.status==='won'?'다음 날 영업하기':'야시장으로 돌아가기',market.state.status==='won'?'townWin':'town');
  $('#decoration').onclick=()=>{
    if(!save.mint){if(save.coins<60){toast('민트 등불은 60코인이 필요해요');return;}save.coins-=60;save.mint=true;save.decoration='mint';}
    else save.decoration=save.decoration==='mint'?'lantern':'mint';persist();showTown();
  };
}
$('#town').onclick=showTown;
$('#primary').onclick=()=>{if(modalMode==='settings')load(Number($('#level-picker').value));else if((modalMode==='win'||modalMode==='townWin'))load((market.state.levelIndex+1)%12);else if(modalMode==='lost')load(market.state.levelIndex);else close();};
$('#undo').onclick=undo;
$('#guide').onclick=()=>{const car=market.readySuggestion();if(!car){toast('이동 중인 트럭과 재료를 기다려주세요');return;}selected={id:car.id,until:market.time+3};toast(`${COLORS[car.color].label} ${CARGO[car.color].name} 트럭의 길이 열려 있어요. 빛나는 트럭을 확인하세요.`,3000);};
async function reward(){
  if(adBusy||market.state.bays.length>=7||market.state.status==='won')return;
  const actual=!!window.PickupRushAds?.showRewarded;
  open('임시 적재장 한 칸',`<p>완료하면 이번 단계에서 적재장 한 칸을 더 쓸 수 있어요.</p><p class="subtle">${actual?'보상형 광고':'웹 프로토타입 · 3초 테스트 광고'}</p><div class="ad-progress"><div id="ad-progress"></div></div>`,'재생 중…','ad');
  adBusy=true;$('#primary').disabled=true;$('#close').hidden=true;
  try{const result=await platform.requestRewardedAd(p=>$('#ad-progress').style.transform=`scaleX(${p})`);
    if(result.rewarded){market.addBay();finished=false;targets();toast(`적재장 ${market.state.bays.length}칸으로 확장했어요`);}else toast('광고가 완료되지 않아 적재장은 그대로예요');
  }catch{toast('광고를 불러오지 못했어요. 무료 재도전도 가능합니다.');}finally{adBusy=false;$('#close').hidden=false;close();}
}
$('#ad').onclick=reward;
function finish(){
  finished=true;
  if(market.state.status==='won'){
    const reward=30,fresh=!save.cleared.includes(market.state.levelIndex);
    save.coins+=reward;if(fresh)save.cleared.push(market.state.levelIndex);save.level=Math.min(11,market.state.levelIndex+1);persist();
    platform.emit('market_level_complete',{level:market.state.levelIndex+1,moves:market.state.moves});
    open('오늘의 야시장 오픈!',`<div class="opening">🏮 ${Object.values(CARGO)[market.state.levelIndex%6].icon} 🏮</div><p>${market.total}개 재료를 모두 배송했어요.<br>${fresh?`${market.state.levelIndex+1}호점에 불이 켜졌습니다!`:'이웃들이 다시 찾아왔어요.'}</p><div class="reward-line">+${reward} 코인 </div><p class="subtle">우리 야시장 ${save.cleared.length}/12 가게 오픈</p><button id="see-town" class="secondary">우리 야시장 보기</button>`,'다음 날 영업하기','win');$('#see-town').onclick=showTown;
  }else{
    open('적재장이 모두 찼어요',`<p>줄 맨 앞 재료와 같은 색 트럭이 없어요.<br>되돌려서 앞줄 색의 트럭이 들어올 자리를 만들어 보세요.</p><button id="lost-undo" class="secondary">무료 되돌리기</button>${market.state.bays.length<7?'<button id="lost-ad" class="secondary">광고로 임시 적재장 +1</button>':''}`,'무료 다시 도전','lost');$('#lost-undo').disabled=!market.canUndo;$('#lost-undo').onclick=undo;if($('#lost-ad'))$('#lost-ad').onclick=reward;
  }
}
function frame(now){
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;if($('#modal').hidden&&!document.hidden)market.tick(dt);
  scene.reduceMotion=reduced.matches;scene.decoration=save.decoration;scene.draw(market,selected);renderQueue();
  $('#coin-count').textContent=save.coins;$('#hint').textContent=`${market.delivered}/${market.total}개 배송 · 적재장 ${market.state.bays.length}/7 · ${market.state.moves}번 배차`;
  $('#undo').disabled=!market.canUndo;$('#game').dataset.status=market.state.status;$('#game').dataset.completed=market.delivered;
  if(now>toastUntil)$('#toast').classList.remove('show');if(market.state.status!=='playing'&&!finished)finish();requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>scene.resize());document.addEventListener('visibilitychange',()=>{last=0;});targets();requestAnimationFrame(frame);toast('맨 앞 재료와 같은 색 트럭을 꺼내세요! 가득 차면 출발합니다.',6000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=19').catch(()=>{});
