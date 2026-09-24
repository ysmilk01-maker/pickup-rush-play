import {LEVELS_PER_DISTRICT,districtFor,stageProfile} from './campaign.js?v=25';
import {Market,MARKET_LEVELS,DISTRICTS,STALL_ICONS} from './market.js?v=25';
import {MarketScene} from './market-scene.js?v=25';
import {LobbyScene} from './lobby-scene.js?v=25';
import {carPose,BAY,CAPACITY} from './traffic.js?v=25';
import {canExit,COLORS,LEVELS} from './game.js?v=25';
import {VEHICLE_MODELS} from './appearance.js?v=25';
import {platform} from './platform.js?v=25';
import {normalize,complete,buyTheme,claimMission,MISSIONS,THEMES,TOTAL_LEVELS} from './progress.js?v=25';
import {checkpoint,restoreSession} from './session.js?v=25';
const $=s=>document.querySelector(s),SAVE='night-bite-market-v1',SESSION='night-bite-session-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
let save=normalize(read(SAVE)),market=null,run=null,view='home',tab='home',district=districtFor(save.level),selected=null,last=0,finished=false,adBusy=false,toastUntil=0,returnFocus=null,primaryAction=null,checkpointSignature='',queueSignature='',audio;
const scene=new MarketScene($('#scene')),lobbyScene=new LobbyScene($('#lobby-scene')),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const restored=restoreSession(read(SESSION),save.unlocked);if(restored){market=restored.market;run=restored.run;}
function toast(text,duration=2400){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=performance.now()+duration;}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save));}catch{toast('저장 공간이 부족해 진행을 저장하지 못했어요.');}}
function checkpointRun(){if(!market||!run)return;const data=checkpoint(market,run);if(data)try{localStorage.setItem(SESSION,JSON.stringify(data));}catch{}}
function clearSession(){try{localStorage.removeItem(SESSION);}catch{}}
function beep(success=false){if(!save.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(success?523:440,now);o.frequency.exponentialRampToValueAtTime(success?1046:660,now+.12);g.gain.setValueAtTime(.045,now);g.gain.exponentialRampToValueAtTime(.001,now+.2);o.connect(g);g.connect(audio.destination);o.start();o.stop(now+.21);}catch{}}
function haptic(){if(save.vibration)platform.haptic();}
function showModal(title,body,label,action){
 if($('#modal').hidden)returnFocus=document.activeElement;
 $('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#primary').textContent=label;$('#primary').disabled=false;primaryAction=action;
 $('#modal').hidden=false;$('#lobby').inert=true;$('#game').inert=true;$('#primary').focus();
}
function hideModal(){if(adBusy)return;$('#modal').hidden=true;$('#lobby').inert=false;$('#game').inert=false;primaryAction=null;returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});}
$('#primary').onclick=()=>{if(!adBusy)primaryAction?.();};
$('#close').onclick=()=>{if(adBusy)return;hideModal();if(finished)showLobby('home');};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(!$('#modal').hidden)$('#close').click();else if(view==='game')pause();}
 if(e.key==='Tab'&&!$('#modal').hidden){const items=[...$('#modal').querySelectorAll('button:not([disabled]):not([hidden]),input')],first=items[0],end=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}}
});
function home(){
 const n=save.level,d=districtFor(n),count=save.cleared.filter(i=>districtFor(i)===d).length;
 $('#lobby-coins').textContent=save.coins;$('#home-district').textContent=`${String(d+1).padStart(2,'0')} · ${DISTRICTS[d].name}`;
 $('#home-next').textContent=MARKET_LEVELS[n].split(' · ')[1];$('#home-progress').textContent=`${count} / ${LEVELS_PER_DISTRICT} 운행 완료`;
 $('#play-label').innerHTML=`${n+1}단계 출발 <i>▶</i>`;$('#play-caption').textContent=save.cleared.length===TOTAL_LEVELS?'모든 골목을 밝혔어요 · 다시 도전':`다음 목적지 · ${DISTRICTS[d].name}`;
 $('#continue').hidden=!market||market.state.status!=='playing';if(market)$('#continue').textContent=`${market.state.levelIndex+1}단계 이어하기 →`;
 $('#mission-dot').hidden=!MISSIONS.some(m=>m.value(save)>=m.target&&!save.claimed.includes(m.id));
}
function showLobby(next='home'){
 checkpointRun();hideModal();view='home';tab=next;$('#lobby').hidden=false;$('#game').hidden=true;
 $('#home-content').hidden=next!=='home';$('#lobby-panel').hidden=next==='home';
 document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 home();if(next!=='home'){renderPanel();$('#lobby-panel').scrollTop=0;}
}
const headings={shop:['MAKE IT YOURS','등불 상점','모은 코인으로 밤의 색을 바꿔 보세요.'],map:['YOUR NIGHT JOURNEY','오늘은 어느 골목으로?','10개 지역, 100번의 밤을 한 단계씩 여행해요.'],garage:['MEET YOUR SHUTTLES','한입특급 차고','차체가 길수록 많은 손님을 태울 수 있어요.'],records:['YOUR LITTLE ACHIEVEMENTS','우리의 운행 기록','한 번의 출발이 모여 야시장을 밝힙니다.']};
function renderPanel(){
 const [k,title,desc]=headings[tab];$('#panel-kicker').textContent=k;$('#panel-title').textContent=title;$('#panel-description').textContent=desc;
 const body=$('#panel-body');
 if(tab==='map'){
  body.innerHTML=`<div class="district-picker"><button id="previous-district" aria-label="이전 지역" ${district===0?'disabled':''}>‹</button><select id="district-select" aria-label="여행 지역 선택">${DISTRICTS.map((d,i)=>`<option value="${i}" ${i===district?'selected':''}>${String(i+1).padStart(2,'0')} · ${d.name} (${i*10+1}–${i*10+10}단계)</option>`).join('')}</select><button id="next-district" aria-label="다음 지역" ${district===DISTRICTS.length-1?'disabled':''}>›</button></div><div class="route-note">${DISTRICTS[district].subtitle}<span>${save.cleared.filter(i=>districtFor(i)===district).length}/${LEVELS_PER_DISTRICT} 완료</span></div><p class="difficulty-note">차량 ${stageProfile(district*10).count}–${stageProfile(district*10+9).count}대 · ${stageProfile(district*10).colors}–${stageProfile(district*10+9).colors}색 · 난이도 ${district*10+1}–${district*10+10}</p><div class="level-grid">${Array.from({length:LEVELS_PER_DISTRICT},(_,i)=>{const n=district*LEVELS_PER_DISTRICT+i,open=n<=save.unlocked;return `<button class="level-node ${n===save.level?'current':''}" data-level="${n}" ${open?'':'disabled'} aria-label="${n+1}단계 ${open?'시작':'잠김'}, 별 ${save.stars[n]||0}개"><b>${open?n+1:'♙'}</b><span>${open?'★'.repeat(save.stars[n]||0)+'☆'.repeat(3-(save.stars[n]||0)):`${n}단계 완료 후`}</span></button>`;}).join('')}</div><p class="panel-foot">★ 완료 · ★★ 기본 4칸 · ★★★ 기본 4칸, 도움 없이 완료<br>이미 받은 별 보상은 중복 지급되지 않아요.</p>`;
  $('#district-select').onchange=e=>{district=Number(e.target.value);renderPanel();};$('#previous-district').onclick=()=>{district--;renderPanel();};$('#next-district').onclick=()=>{district++;renderPanel();};body.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>requestStart(Number(b.dataset.level)));
 }else if(tab==='shop'){
  body.innerHTML=`<div class="balance-card"><small>보유 코인</small><strong>● ${save.coins}</strong><span>첫 완료 40 + 새 별마다 10 코인</span></div><div class="theme-list">${THEMES.map(t=>`<button class="theme-card" data-theme="${t.id}" style="--theme:${t.color}" aria-label="${t.name} ${save.owned.includes(t.id)?'적용':t.price+'코인 구매'}"><span class="theme-art">🏮</span><span><strong>${t.name}</strong><small>${t.description}</small></span><b>${save.decoration===t.id?'사용 중':save.owned.includes(t.id)?'적용':`● ${t.price}`}</b></button>`).join('')}</div><p class="panel-foot">꾸미기는 외형에만 적용돼요.<br>승객과 차량의 색상 구분은 그대로 유지됩니다.</p>`;
  body.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{const t=THEMES.find(t=>t.id===b.dataset.theme);if(save.owned.includes(t.id)){buyTheme(save,t.id);persist();home();renderPanel();beep();return;}if(save.coins<t.price){toast('코인이 부족해요. 운행과 미션으로 모아 보세요.');return;}showModal(t.name,`<p>${t.price}코인으로 이 등불을 구매할까요?</p><p class="subtle">구매 후에도 다른 등불로 자유롭게 바꿀 수 있어요.</p>`,'구매하고 적용',()=>{buyTheme(save,t.id);persist();hideModal();home();renderPanel();beep();});});
 }else if(tab==='garage'){
  const models=Object.entries(VEHICLE_MODELS);
  body.innerHTML=`<div class="garage-grid">${models.map(([id,m])=>`<article class="vehicle-card"><canvas width="220" height="120" data-model="${id}" aria-label="${m.label} 외형"></canvas><div><strong>${m.label}</strong><span>${{sedan:4,taxi:4,suv:6,van:6,bus:10}[id]}인승</span></div><p>${{sedan:'작고 날렵한 골목의 발',taxi:'지붕 표시등이 반짝이는 택시',suv:'든든한 차체의 여유로운 셔틀',van:'손님 여섯을 태우는 봉고차',bus:'긴 차체에 열 명이 함께 타요'}[id]}</p></article>`).join('')}</div><p class="panel-foot">모든 차량은 처음부터 등장해요.<br>차종을 구매하거나 성능을 강화할 필요가 없습니다.</p>`;
  for(const canvas of body.querySelectorAll('canvas')){const model=canvas.dataset.model,type=['sedan','taxi'].includes(model)?'taxi':model==='bus'?'bus':'van';const preview=new MarketScene(canvas);canvas.width=440;canvas.height=240;preview.c.setTransform(3.6,0,0,3.6,-176,-92);preview.vehicle({model,type,color:{sedan:'red',taxi:'yellow',suv:'cyan',van:'purple',bus:'blue'}[model]}, {x:110,y:77,angle:-.28});}
 }else{
  const stars=Object.values(save.stars).reduce((a,b)=>a+b,0);
  body.innerHTML=`<div class="record-grid"><article><span>여행한 단계</span><b>${save.cleared.length}<small> / ${TOTAL_LEVELS}</small></b></article><article><span>모은 별</span><b>${stars}<small> / ${TOTAL_LEVELS*3}</small></b></article><article><span>손님 수송</span><b>${save.boarded.toLocaleString()}<small>명</small></b></article><article><span>완료한 운행</span><b>${save.wins}<small>회</small></b></article></div><h2 class="small-heading">골목별 발자취</h2>${DISTRICTS.map((d,i)=>{const n=save.cleared.filter(l=>districtFor(l)===i).length;return `<div class="district-record"><span>${d.icon}</span><div><b>${d.name}</b><progress value="${n}" max="${LEVELS_PER_DISTRICT}" aria-label="${d.name} ${n}/${LEVELS_PER_DISTRICT} 완료"></progress></div><strong>${n}/${LEVELS_PER_DISTRICT}</strong></div>`;}).join('')}<button class="secondary" id="records-missions">운행 미션 보상 확인</button><p class="panel-foot">기록은 이 기기에 저장됩니다.<br>브라우저 데이터를 삭제하면 기록도 삭제됩니다.</p>`;$('#records-missions').onclick=missions;
 }
}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{beep();showLobby(b.dataset.tab);};
$('#wallet').onclick=()=>showLobby('shop');$('#profile').onclick=()=>showLobby('records');
function missions(){showModal('오늘도 한 걸음',`<div class="mission-list">${MISSIONS.map(m=>`<article><div><strong>${m.name}</strong><small>${m.description}</small><progress value="${Math.min(m.target,m.value(save))}" max="${m.target}"></progress><small>${Math.min(m.target,m.value(save))}/${m.target}</small></div><button data-claim="${m.id}" ${save.claimed.includes(m.id)||m.value(save)<m.target?'disabled':''}>${save.claimed.includes(m.id)?'받음':`● ${m.reward}`}</button></article>`).join('')}</div>`,'확인',hideModal);document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{if(claimMission(save,b.dataset.claim)){persist();home();missions();beep(true);}});}
$('#missions').onclick=missions;
function help(done=hideModal){showModal('야시장행 셔틀 안내',`<div class="tutorial"><div><b>1</b><p><strong>맨 앞 손님의 옷 색을 보세요.</strong><br>같은 색 셔틀에만 탈 수 있어요.</p></div><div><b>2</b><p><strong>화살표 앞이 열린 차를 꺼내요.</strong><br>다른 차가 막으면 먼저 길을 열어 주세요.</p></div><div><b>3</b><p><strong>가득 차면 야시장으로 출발!</strong><br>덜 탄 차는 다음 같은 색 손님을 기다려요.</p></div></div><p class="subtle">승강장 기본 4칸 · 최대 7칸<br>시간제한 없이 천천히 생각해도 괜찮아요.</p>`,'알겠어요',done);}
$('#howto').onclick=()=>help();
function settings(){showModal('편안한 운행을 위해',`<div class="setting-row"><label for="sound-toggle">효과음</label><input id="sound-toggle" type="checkbox" ${save.sound?'checked':''}></div><div class="setting-row"><label for="vibration-toggle">진동</label><input id="vibration-toggle" type="checkbox" ${save.vibration?'checked':''}></div><button id="settings-help" class="secondary">게임 방법</button><button id="settings-info" class="secondary">저장 및 서비스 안내</button><p class="subtle">버전 0.3.0 · 야시장 한입특급</p>`,'확인',hideModal);$('#sound-toggle').onchange=e=>{save.sound=e.target.checked;persist();beep();};$('#vibration-toggle').onchange=e=>{save.vibration=e.target.checked;persist();haptic();};$('#settings-help').onclick=()=>help(settings);$('#settings-info').onclick=()=>showModal('저장 및 서비스 안내','<p>계정 없이 플레이하며 진행·코인·설정은 이 기기의 브라우저에 저장됩니다. 다른 기기와 동기화되지 않습니다.</p><p>운행 중에는 차량과 손님의 이동이 끝난 시점을 저장합니다. 새로고침하면 마지막 저장 지점에서 이어할 수 있습니다.</p><p class="subtle">현재 공개 웹 체험판입니다. 실제 광고 서비스가 연결되지 않은 환경에서는 확장 버튼에 테스트 광고임을 표시합니다. 유료 결제는 제공하지 않습니다.</p>','설정으로 돌아가기',settings);}
$('#lobby-settings').onclick=settings;
function requestStart(index){
 if(index<0||index>save.unlocked)return;
 if(market?.state.status==='playing'&&market.state.moves>0){showModal('새 운행을 시작할까요?','<p>진행 중인 운행은 처음부터 다시 시작하게 됩니다. 완료한 단계와 코인은 유지됩니다.</p><button id="keep-run" class="secondary">진행 중인 운행 이어하기</button>','새 운행 시작',()=>start(index));$('#keep-run').onclick=resume;}else start(index);
}
function start(index){
 hideModal();market=new Market(index);run={hints:0,undos:0,seconds:0};save.level=index;persist();finished=false;selected=null;checkpointSignature='';queueSignature='';
 enterGame();checkpointRun();beep();if(!save.tutorial)help(()=>{save.tutorial=true;persist();hideModal();});else toast('덜 탄 차는 다음 같은 색 손님을 기다려요.');
}
function enterGame(){hideModal();view='game';$('#lobby').hidden=true;$('#game').hidden=false;targets();$('#game-level').textContent=`${market.state.levelIndex+1}단계 · ${DISTRICTS[districtFor(market.state.levelIndex)].name}`;}
function resume(){if(!market)return;enterGame();}
$('#play').onclick=()=>requestStart(save.level);$('#continue').onclick=resume;
function targets(){
 $('#car-targets').replaceChildren();for(const car of market.state.cars){const p=carPose(car,market.state),b=document.createElement('button');b.className='car-target';b.dataset.carId=car.id;b.style.cssText=`left:${(p.x-20)/6}%;top:${(p.y-25)/10.8}%;width:7%;height:4%`;b.setAttribute('aria-label',`${COLORS[car.color].label} ${VEHICLE_MODELS[car.model||car.type].label}, ${CAPACITY[car.type]}인승, ${canExit(market.state,car)?'이동 가능':'길 막힘'}`);b.onclick=()=>dispatch(car.id);$('#car-targets').append(b);}
 $('#locked-targets').replaceChildren();for(let i=market.state.bays.length;i<7;i++){const b=document.createElement('button');b.className='locked-target';b.style.left=`${(BAY(i).x-30)/6}%`;b.setAttribute('aria-label',`광고 보고 승강장 ${i+1}번 칸 열기`);b.onclick=reward;$('#locked-targets').append(b);}$('#ad').disabled=market.state.bays.length>=7;
}
function renderQueue(){const color=market.state.queue[0],signature=`${color}:${market.state.queue.length}`;if(signature===queueSignature)return;queueSignature=signature;$('#queue-summary').textContent=color?`맨 앞 ${COLORS[color].short} ${COLORS[color].label} 옷 손님`:'모두 탑승했어요!';$('#queue-summary').style.setProperty('--cargo-color',color?COLORS[color].hex:'#fff0cc');}
function dispatch(id){if(view!=='game'||adBusy||!$('#modal').hidden)return;checkpointRun();const result=market.dispatch(id);if(!result.ok){toast(result.reason==='blocked'?'화살표 앞을 막은 차부터 꺼내주세요.':'승강장이 가득 찼어요. 되돌려서 길을 열어 보세요.');selected={id,until:market.time+.5};return;}haptic();beep();targets();}
$('#scene').addEventListener('pointerup',e=>{if(!market)return;const r=$('#scene').getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car)dispatch(car.id);});
function undo(){if(market.undo()){run.undos++;finished=false;targets();hideModal();checkpointRun();toast('배차 전으로 돌아왔어요.');}else toast('주행과 탑승이 끝나면 되돌릴 수 있어요.');}
$('#undo').onclick=undo;
$('#guide').onclick=()=>{const car=market.readySuggestion();if(!car){toast('이동 중인 셔틀을 기다려 주세요.');return;}run.hints++;selected={id:car.id,until:market.time+3};toast(`${COLORS[car.color].label} ${VEHICLE_MODELS[car.model||car.type].label}의 길이 열려 있어요.`,3000);};
function pause(){showModal(`${market.state.levelIndex+1}단계 · 잠시 쉬어가기`,'<p>지금은 운행이 멈춰 있습니다.</p><button class="secondary" id="pause-retry">이 단계 다시 시작</button><button class="secondary" id="pause-home">대기실로 돌아가기</button><button class="secondary" id="pause-settings">설정</button>','계속 운행하기',hideModal);$('#pause-retry').onclick=()=>showModal('다시 시작할까요?','<p>이번 단계의 차량과 손님이 처음 위치로 돌아갑니다.</p>','다시 시작',()=>start(market.state.levelIndex));$('#pause-home').onclick=()=>showLobby('home');$('#pause-settings').onclick=settings;}
$('#settings').onclick=pause;$('#town').onclick=()=>showLobby('home');
async function reward(){
 if(adBusy||market.state.bays.length>=7||market.state.status==='won')return;
 const actual=!!window.PickupRushAds?.showRewarded;
 showModal('승강장 한 칸 더',`<p>완료하면 이번 단계에서 승강장 한 칸을 더 쓸 수 있어요.</p><p class="subtle">${actual?'보상형 광고':'웹 체험판 · 3초 테스트 광고'}<br>승강장 확장을 사용한 완료는 별 1개를 받습니다.</p><div class="ad-progress"><div id="ad-progress"></div></div>`,actual?'광고 보기':'테스트 광고 보기',async()=>{
  adBusy=true;$('#primary').disabled=true;$('#close').hidden=true;
  try{const r=await platform.requestRewardedAd(p=>$('#ad-progress').style.transform=`scaleX(${p})`);if(r.rewarded){market.addBay();finished=false;targets();checkpointRun();toast(`승강장 ${market.state.bays.length}칸으로 확장했어요.`);}else toast('광고가 완료되지 않아 보상이 지급되지 않았어요.');}catch{toast('광고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');}finally{adBusy=false;$('#close').hidden=false;hideModal();if(market.state.status==='lost')finished=false;}
 });
}
$('#ad').onclick=reward;
function finish(){
 finished=true;
 if(market.state.status==='won'){
  const n=market.state.levelIndex,result=complete(save,n,{...run,bays:market.state.bays.length,passengers:market.total});persist();clearSession();beep(true);
  showModal(result.all?'모든 골목을 밝혔어요!':'야시장에 도착했어요!',`<div class="result-stars" aria-label="별 ${result.stars}개">${'★'.repeat(result.stars)}${'☆'.repeat(3-result.stars)}</div><p>${market.total}명의 손님과 함께한 ${n+1}번째 정류장</p><div class="result-stats"><span>운행 시간<b>${Math.floor(run.seconds/60)}:${String(Math.floor(run.seconds%60)).padStart(2,'0')}</b></span><span>획득 코인<b>+${result.reward}</b></span></div><p class="subtle">${result.stars===3?'도움 없이 기본 4칸으로 완주했어요!':result.stars===2?'기본 4칸으로 완주했어요. 도움 없이 도전하면 별 3개!':'다음에는 기본 4칸으로 도전해 보세요.'}</p><button id="result-home" class="secondary">대기실로 돌아가기</button>`,n<TOTAL_LEVELS-1?'다음 단계 출발':'여정 둘러보기',()=>{if(n<TOTAL_LEVELS-1)start(n+1);else showLobby('map');});$('#result-home').onclick=()=>showLobby('home');
 }else{
  showModal('승강장이 모두 찼어요','<p>줄 맨 앞 손님과 같은 색 셔틀이 없어요.<br>되돌려서 필요한 차가 들어올 자리를 만들어 보세요.</p><button id="lost-undo" class="secondary">무료 되돌리기</button><button id="lost-ad" class="secondary">광고로 승강장 +1</button><button id="lost-home" class="secondary">대기실로 돌아가기</button>','무료 다시 도전',()=>start(market.state.levelIndex));$('#lost-undo').disabled=!market.canUndo;$('#lost-undo').onclick=undo;$('#lost-ad').disabled=market.state.bays.length>=7;$('#lost-ad').onclick=reward;$('#lost-home').onclick=()=>showLobby('home');
 }
}
let lobbyFrame=0;
function frame(now){
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(view==='game'&&market){
  if($('#modal').hidden&&!document.hidden){market.tick(dt);run.seconds+=dt;}
  scene.reduceMotion=reduced.matches;scene.decoration=save.decoration;scene.draw(market,selected);renderQueue();
  $('#coin-count').textContent=save.coins;$('#hint').textContent=`${market.delivered}/${market.total}명 탑승 · 승강장 ${market.state.bays.length}/7 · ${market.state.moves}번 배차`;
  $('#undo').disabled=!market.canUndo;$('#game').dataset.status=market.state.status;$('#game').dataset.completed=market.delivered;
  const signature=`${market.state.moves}:${market.delivered}:${market.state.bays.filter(Boolean).length}:${Math.floor(run.seconds/5)}`;
  if(!market.busy&&signature!==checkpointSignature){checkpointRun();checkpointSignature=signature;}
  if(market.state.status!=='playing'&&!finished)finish();
 }else if(now-lobbyFrame>65){lobbyScene.draw(now/1000,save.decoration,reduced.matches);lobbyFrame=now;}
 if(now>toastUntil)$('#toast').classList.remove('show');requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>{scene.resize();lobbyScene.resize();});document.addEventListener('visibilitychange',()=>{last=0;checkpointRun();});window.addEventListener('pagehide',checkpointRun);
showLobby();if(restored&&market.demandVersion<3)toast('새 배차 방식은 새 운행부터 적용돼요.',5000);$('#loading').hidden=true;requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=25').catch(()=>{});
