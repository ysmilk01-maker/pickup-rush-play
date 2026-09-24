import { Market, RECIPES, INGREDIENTS, MARKET_LEVELS } from './market.js?v=16';
import { carPose, BAY } from './traffic.js?v=16';
import { MarketScene } from './market-scene.js?v=16';
import { canExit } from './game.js?v=16';
import { platform } from './platform.js?v=16';
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
    b.setAttribute('aria-label',`${RECIPES[car.recipe].short} 트럭, ${car.dir} 방향, ${canExit(market.state,car)?'이동 가능':'길 막힘'}`);
    b.onclick=()=>dispatch(car.id);$('#car-targets').append(b);
  }
  $('#locked-targets').replaceChildren();
  for(let i=market.state.bays.length;i<7;i++){
    const b=document.createElement('button');b.className='locked-target';b.style.left=`${(BAY(i).x-30)/6}%`;
    b.setAttribute('aria-label',`광고 보고 주방 ${i+1}번 칸 열기`);b.onclick=reward;$('#locked-targets').append(b);
  }
  $('#ad').disabled=market.state.bays.length>=7;orderSignature='';
}
function renderOrders(){
  const signature=JSON.stringify([market.orders,market.preferred,market.completed]);
  if(signature===orderSignature)return;orderSignature=signature;
  const focused=document.activeElement?.dataset.orderId;$('#orders').replaceChildren();
  for(const order of market.orders){
    const recipe=RECIPES[order.recipe],b=document.createElement('button');b.className='order-card'+(order.featured&&market.completed<2?' special':'');b.dataset.orderId=order.id;
    b.setAttribute('aria-pressed',String(market.preferred===order.id));
    b.setAttribute('aria-label',`${recipe.name} 주문, ${Object.entries(recipe.needs).map(([k,n])=>`${INGREDIENTS[k].name} ${n}개`).join(', ')}, ${order.truckId?'조리 진행':'트럭 필요'}, 누르면 재료 우선 공급`);
    b.innerHTML=`<span class="dish">${recipe.icon}</span><span class="order-name">${recipe.short}<small>${order.featured&&market.completed<2?'★ 두 번째 완성까지 팁':order.truckId?'재료 싣는 중':'트럭을 꺼내주세요'}</small></span><span class="recipe">${Object.entries(recipe.needs).map(([k,n])=>`${INGREDIENTS[k].icon}${n>1?'×'+n:''}`).join(' ')}</span>`;
    b.onclick=()=>{market.prioritize(order.id);orderSignature='';toast(`${recipe.short} 주문에 재료를 먼저 보냅니다`);};$('#orders').append(b);
  }
  if(focused)$('#orders').querySelector(`[data-order-id="${focused}"]`)?.focus({preventScroll:true});
  const next=market.manifest[market.nextOrder];$('#next-order').textContent=next?`다음 ${RECIPES[next.recipe].icon} ${RECIPES[next.recipe].short} · 주문을 누르면 재료 우선 공급`:'마지막 주문입니다 · 주방을 모두 비우면 야시장 오픈!';
}
function dispatch(id){
  if(adBusy||!$('#modal').hidden)return;const result=market.dispatch(id);
  if(!result.ok){toast(result.reason==='blocked'?'화살표 앞을 막은 트럭부터 꺼내주세요':'주방이 가득 찼어요. 주문을 완성하거나 되돌려 보세요.');selected={id,until:market.time+.5};return;}
  platform.haptic();targets();
}
canvas.addEventListener('pointerup',e=>{const r=canvas.getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car)dispatch(car.id);});
function open(title,body,button,mode){
  if($('#modal').hidden)returnFocus=document.activeElement;modalMode=mode;$('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#primary').textContent=button;
  $('#primary').disabled=false;$('#modal').hidden=false;$('#primary').focus();
}
function close(){if(adBusy)return;$('#modal').hidden=true;modalMode='';(returnFocus?.isConnected?returnFocus:$('#settings')).focus({preventScroll:true});}
function load(index){market=new Market(index);finished=false;selected=null;targets();close();platform.emit('market_level_start',{level:index+1});}
function undo(){if(market.undo()){finished=false;targets();close();toast('배차 전으로 돌아왔어요. 다른 주문부터 도전해 보세요.');}else toast('주행과 조리가 끝나면 되돌릴 수 있어요');}
$('#close').onclick=close;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')close();
  if(e.key==='Tab'&&!$('#modal').hidden){
    const items=[...$('#modal').querySelectorAll('button:not([disabled]):not([hidden]),select')],first=items[0],end=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}
  }
});
$('#settings').onclick=()=>{
  open('오늘의 영업 준비',`<p>① 위쪽 주문의 메뉴를 확인해요.<br>② 화살표 앞이 열린 트럭을 꺼내요.<br>③ 재료가 뛰어들고, 요리가 완성되면 출발!</p><p class="subtle">주문을 누르면 재료를 먼저 보냅니다.<br>★ 손님 주문을 두 번째 요리까지 완성하면 팁 +10.<br>시간제한 없이 생각해도 괜찮아요.</p><select id="level-picker" aria-label="야시장 단계 선택">${MARKET_LEVELS.map((name,i)=>`<option value="${i}" ${i===market.state.levelIndex?'selected':''}>${i+1}일차 · ${name}</option>`).join('')}</select><p class="subtle">3개 메뉴로 시작 · 4/7/10일차에 새 메뉴<br>기본 주방 4칸 · 광고 확장 최대 7칸</p>`,'선택한 날 시작','settings');
};
function showTown(){
  open('우리 야시장의 불빛',`<p>${save.cleared.length}/12 가게 오픈 · 한 단계를 끝낼 때마다 새 가게에 불이 켜져요.</p><div class="town">${MARKET_LEVELS.map((name,i)=>`<div class="stall ${save.cleared.includes(i)?'lit':''}"><span>${Object.values(RECIPES)[i%6].icon}</span><b>${i+1}호점</b><small>${save.cleared.includes(i)?'영업 중':'오픈 준비'}</small></div>`).join('')}</div><p class="subtle">${save.cleared.length===12?'모든 가게가 열렸어요!':'다음 오픈을 기다리는 이웃들이 있어요.'}</p><button id="decoration" class="secondary">${save.mint?(save.decoration==='mint'?'따뜻한 등불로 바꾸기':'민트 등불로 바꾸기'):'민트 등불 꾸미기 · 60 코인'}</button>`,market.state.status==='won'?'다음 날 영업하기':'야시장으로 돌아가기',market.state.status==='won'?'townWin':'town');
  $('#decoration').onclick=()=>{
    if(!save.mint){if(save.coins<60){toast('민트 등불은 60코인이 필요해요');return;}save.coins-=60;save.mint=true;save.decoration='mint';}
    else save.decoration=save.decoration==='mint'?'lantern':'mint';persist();showTown();
  };
}
$('#town').onclick=showTown;
$('#primary').onclick=()=>{if(modalMode==='settings')load(Number($('#level-picker').value));else if((modalMode==='win'||modalMode==='townWin'))load((market.state.levelIndex+1)%12);else if(modalMode==='lost')load(market.state.levelIndex);else close();};
$('#undo').onclick=undo;
$('#guide').onclick=()=>{const car=market.readySuggestion();if(!car){toast('주방의 요리가 완성될 때까지 기다려주세요');return;}selected={id:car.id,until:market.time+3};toast(`${RECIPES[car.recipe].short} 트럭의 길이 열려 있어요. 빛나는 트럭을 확인하세요.`,3000);};
async function reward(){
  if(adBusy||market.state.bays.length>=7||market.state.status==='won')return;
  const actual=!!window.PickupRushAds?.showRewarded;
  open('임시 주방 한 칸',`<p>완료하면 이번 단계에서 주방 한 칸을 더 쓸 수 있어요.</p><p class="subtle">${actual?'보상형 광고':'웹 프로토타입 · 3초 테스트 광고'}</p><div class="ad-progress"><div id="ad-progress"></div></div>`,'재생 중…','ad');
  adBusy=true;$('#primary').disabled=true;$('#close').hidden=true;
  try{const result=await platform.requestRewardedAd(p=>$('#ad-progress').style.transform=`scaleX(${p})`);
    if(result.rewarded){market.addBay();finished=false;targets();toast(`주방 ${market.state.bays.length}칸으로 확장했어요`);}else toast('광고가 완료되지 않아 주방은 그대로예요');
  }catch{toast('광고를 불러오지 못했어요. 무료 재도전도 가능합니다.');}finally{adBusy=false;$('#close').hidden=false;close();}
}
$('#ad').onclick=reward;
function finish(){
  finished=true;
  if(market.state.status==='won'){
    const reward=30+(market.featuredWon?10:0),fresh=!save.cleared.includes(market.state.levelIndex);
    save.coins+=reward;if(fresh)save.cleared.push(market.state.levelIndex);save.level=Math.min(11,market.state.levelIndex+1);persist();
    platform.emit('market_level_complete',{level:market.state.levelIndex+1,moves:market.state.moves,bonus:market.featuredWon});
    open('오늘의 야시장 오픈!',`<div class="opening">🏮 ${Object.values(RECIPES)[market.state.levelIndex%6].icon} 🏮</div><p>${market.total}접시가 손님에게 도착했어요.<br>${fresh?`${market.state.levelIndex+1}호점에 불이 켜졌습니다!`:'이웃들이 다시 찾아왔어요.'}</p><div class="reward-line">+${reward} 코인 ${market.featuredWon?'· 특별 손님 팁 포함':''}</div><p class="subtle">우리 야시장 ${save.cleared.length}/12 가게 오픈</p><button id="see-town" class="secondary">우리 야시장 보기</button>`,'다음 날 영업하기','win');$('#see-town').onclick=showTown;
  }else{
    open('주방이 모두 찼어요',`<p>대기 중인 트럭의 메뉴가 현재 주문과 달라요.<br>주문에 맞는 트럭부터 꺼내 보세요.</p><button id="lost-undo" class="secondary">무료 되돌리기</button>${market.state.bays.length<7?'<button id="lost-ad" class="secondary">광고로 임시 주방 +1</button>':''}`,'무료 다시 도전','lost');$('#lost-undo').disabled=!market.canUndo;$('#lost-undo').onclick=undo;if($('#lost-ad'))$('#lost-ad').onclick=reward;
  }
}
function frame(now){
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;if($('#modal').hidden&&!document.hidden)market.tick(dt);
  scene.reduceMotion=reduced.matches;scene.decoration=save.decoration;scene.draw(market,selected);renderOrders();
  $('#coin-count').textContent=save.coins;$('#hint').textContent=`${market.completed}/${market.total}접시 · 주방 ${market.state.bays.length}/7 · ${market.state.moves}번 배차`;
  $('#undo').disabled=!market.canUndo;$('#game').dataset.status=market.state.status;$('#game').dataset.completed=market.completed;
  if(now>toastUntil)$('#toast').classList.remove('show');if(market.state.status!=='playing'&&!finished)finish();requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>scene.resize());document.addEventListener('visibilitychange',()=>{last=0;});targets();requestAnimationFrame(frame);toast('위의 메뉴를 보고, 같은 음식 간판의 트럭을 꺼내세요!',6000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=16').catch(()=>{});
