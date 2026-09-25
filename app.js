import {SoundEffects} from './sfx.js?v=42';
import {pendingCars,garageStatus,routeOptions,chooseRoute} from './garage.js?v=42';
import {MusicPlayer,TRACKS} from './music.js?v=42';
import {LEVELS_PER_DISTRICT,districtFor,stageProfile} from './campaign.js?v=42';
import {Market,MARKET_LEVELS,DISTRICTS,STALL_ICONS} from './market.js?v=42';
import {MarketScene} from './market-scene.js?v=42';
import {LobbyScene} from './lobby-scene.js?v=42';
import {carPose,BAY,CAPACITY} from './traffic.js?v=42';
import {canExit,COLORS,LEVELS} from './game.js?v=42';
import {VEHICLE_MODELS} from './appearance.js?v=42';
import {platform} from './platform.js?v=42';
import {normalize,complete,buyTheme,claimMission,MISSIONS,THEMES,TOTAL_LEVELS,marketGrowth} from './progress.js?v=42';
import {checkpoint,restoreSession} from './session.js?v=42';
const $=s=>document.querySelector(s),SAVE='night-bite-market-v1',SESSION='night-bite-session-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
let save=normalize(read(SAVE)),market=null,run=null,view='home',tab='home',district=districtFor(save.level),selected=null,last=0,finished=false,adBusy=false,toastUntil=0,returnFocus=null,primaryAction=null,checkpointSignature='',queueSignature='',practiceReturn=null,boardSignature='',garageSignature='',comboShown=0,comboUntil=0;
const sfx=new SoundEffects();
const music=new MusicPlayer();music.audio.id='bgm-audio';music.audio.hidden=true;document.body.append(music.audio);
const scene=new MarketScene($('#scene')),lobbyScene=new LobbyScene($('#lobby-scene')),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const restored=restoreSession(read(SESSION),save.unlocked);if(restored){market=restored.market;run=restored.run;}
function toast(text,duration=2400){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=performance.now()+duration;}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save));}catch{toast('저장 공간이 부족해 진행을 저장하지 못했어요.');}}
function checkpointRun(){if(!market||!run||run.practice)return;const data=checkpoint(market,run);if(data)try{localStorage.setItem(SESSION,JSON.stringify(data));}catch{}}
function clearSession(){try{localStorage.removeItem(SESSION);}catch{}}
function beep(success=false){sfx.play(success?'combo':'ui');}
function haptic(){if(save.vibration)platform.haptic();}
function showModal(title,body,label,action){
 if($('#modal').hidden)returnFocus=document.activeElement;
 $('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#primary').textContent=label;$('#primary').disabled=false;primaryAction=action;
 $('#modal').hidden=false;$('#lobby').inert=true;$('#game').inert=true;$('#primary').focus();
}
function hideModal(){if(adBusy)return;$('#modal').hidden=true;$('#lobby').inert=!$('#loading').hidden;$('#game').inert=!$('#loading').hidden;primaryAction=null;returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});}
$('#primary').onclick=()=>{if(!adBusy)primaryAction?.();};
$('#close').onclick=()=>{if(adBusy)return;hideModal();if(finished)showLobby('home');};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(!$('#modal').hidden)$('#close').click();else if(view==='game')pause();}
 if(e.key==='Tab'&&!$('#modal').hidden){const items=[...$('#modal').querySelectorAll('button:not([disabled]):not([hidden]),input')],first=items[0],end=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}}
});
function home(){
 const n=save.level,d=districtFor(n),count=save.cleared.filter(i=>districtFor(i)===d).length;
 const continuing=market?.state.status==='playing';
 $('#lobby').dataset.decoration=save.decoration;
 $('#home-content').classList.toggle('has-resume',!!continuing);
 $('#lobby-route-name').textContent=DISTRICTS[d].name;
 $('#home-cleared').textContent=save.cleared.length;
 $('#home-stars').textContent=Object.values(save.stars).reduce((sum,value)=>sum+value,0);
 renderGrowth();
 $('#home-fleet').textContent=`${stageProfile(n).count}대 · ${stageProfile(n).colors}색`;
 $('#home-track').innerHTML=Array.from({length:LEVELS_PER_DISTRICT},(_,i)=>{const level=d*LEVELS_PER_DISTRICT+i;return `<i class="${save.cleared.includes(level)?'done':level===n?'current':''}"></i>`;}).join('');
 $('#lobby-coins').textContent=save.coins;$('#home-district').textContent=`${String(d+1).padStart(2,'0')} · ${DISTRICTS[d].name}`;
 $('#home-next').textContent=`· ${MARKET_LEVELS[n].split(' · ')[1]}`;$('#home-progress').textContent=`${count} / ${LEVELS_PER_DISTRICT} 완료`;
 $('#play-label').innerHTML=continuing?`${n+1}단계 처음부터 시작 ↗`:`${n+1}단계 출발 <i>▶</i>`;$('#play-caption').textContent=save.cleared.length===TOTAL_LEVELS?'모든 골목을 밝혔어요 · 다시 도전':'셔틀이 기다리고 있어요';
 $('#continue').hidden=!continuing;if(continuing)$('#continue').innerHTML=`<small>${market.delivered}/${market.total}명 탑승 · 운행 중</small><strong>${market.state.levelIndex+1}단계 이어하기 <i>▶</i></strong>`;
 $('#mission-dot').hidden=!MISSIONS.some(m=>m.value(save)>=m.target&&!save.claimed.includes(m.id));
}
function showLobby(next='home'){
 sfx.stop();
 if(run?.practice&&practiceReturn){({market,run,finished}=practiceReturn);practiceReturn=null;}
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
  body.innerHTML=`<div class="garage-grid">${models.map(([id,m])=>`<article class="vehicle-card"><canvas width="220" height="120" data-model="${id}" aria-label="${m.label} 외형"></canvas><div><strong>${m.label}</strong><span>${{sedan:4,taxi:4,suv:6,van:6,bus:10}[id]}인승</span></div><p>${{sedan:'작고 날렵한 골목의 발',taxi:'지붕 표시등이 반짝이는 택시',suv:'든든한 차체의 여유로운 셔틀',van:'손님 여섯을 태우는 봉고차',bus:'긴 차체에 열 명이 함께 타요'}[id]}</p></article>`).join('')}</div><p class="panel-foot">차종을 구매할 필요 없이 모두 만날 수 있어요.<br>11단계부터 일부 셔틀은 차고에서 나중에 들어옵니다.</p>`;
  for(const canvas of body.querySelectorAll('canvas')){const model=canvas.dataset.model,type=['sedan','taxi'].includes(model)?'taxi':model==='bus'?'bus':'van';const preview=new MarketScene(canvas);canvas.width=440;canvas.height=240;preview.c.setTransform(3.6,0,0,3.6,-176,-92);preview.vehicle({model,type,color:{sedan:'red',taxi:'yellow',suv:'cyan',van:'purple',bus:'blue'}[model]}, {x:110,y:77,angle:-.28});}
 }else{
  const stars=Object.values(save.stars).reduce((a,b)=>a+b,0);
  body.innerHTML=`<div class="record-grid"><article><span>여행한 단계</span><b>${save.cleared.length}<small> / ${TOTAL_LEVELS}</small></b></article><article><span>모은 별</span><b>${stars}<small> / ${TOTAL_LEVELS*3}</small></b></article><article><span>손님 수송</span><b>${save.boarded.toLocaleString()}<small>명</small></b></article><article><span>완료한 운행</span><b>${save.wins}<small>회</small></b></article></div><h2 class="small-heading">골목별 발자취</h2>${DISTRICTS.map((d,i)=>{const n=save.cleared.filter(l=>districtFor(l)===i).length;return `<div class="district-record"><span>${d.icon}</span><div><b>${d.name}</b><progress value="${n}" max="${LEVELS_PER_DISTRICT}" aria-label="${d.name} ${n}/${LEVELS_PER_DISTRICT} 완료"></progress></div><strong>${n}/${LEVELS_PER_DISTRICT}</strong></div>`;}).join('')}<button class="secondary" id="records-missions">운행 미션 보상 확인</button><p class="panel-foot">기록은 이 기기에 저장됩니다.<br>브라우저 데이터를 삭제하면 기록도 삭제됩니다.</p>`;$('#records-missions').onclick=missions;
 }
}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{beep();showLobby(b.dataset.tab);};
$('#wallet').onclick=()=>showLobby('shop');$('#profile').onclick=()=>showLobby('records');
$('#home-map').onclick=()=>{district=districtFor(save.level);showLobby('map');};
function missions(){showModal('오늘도 한 걸음',`<div class="mission-list">${MISSIONS.map(m=>`<article><div><strong>${m.name}</strong><small>${m.description}</small><progress value="${Math.min(m.target,m.value(save))}" max="${m.target}"></progress><small>${Math.min(m.target,m.value(save))}/${m.target}</small></div><button data-claim="${m.id}" ${save.claimed.includes(m.id)||m.value(save)<m.target?'disabled':''}>${save.claimed.includes(m.id)?'받음':`● ${m.reward}`}</button></article>`).join('')}</div>`,'확인',hideModal);document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{if(claimMission(save,b.dataset.claim)){persist();home();missions();beep(true);}});}
$('#missions').onclick=missions;
function help(done=hideModal){showModal('야시장행 셔틀 안내',`<div class="tutorial"><div><b>1</b><p><strong>맨 앞 손님의 옷 색을 보세요.</strong><br>같은 색 셔틀에만 탈 수 있어요.</p></div><div><b>2</b><p><strong>화살표 앞이 열린 차를 꺼내요.</strong><br>다른 차가 막으면 먼저 길을 열어 주세요.</p></div><div><b>3</b><p><strong>가득 차면 야시장으로 출발!</strong><br>덜 탄 차는 다음 같은 색 손님을 기다려요.</p></div></div><p class="subtle">승강장 기본 4칸 · 최대 7칸<br>11단계부터 차고의 응급차가 등장해요.<br>지정 색 손님을 태워 6→5→4번 배차 안에 출발하면 단계별 보너스 +20코인!<br>실패해도 운행은 계속됩니다.<br>다음 배차 전 만차 출발이 이어지면 콤보!<br>15단계부터 5단계마다 차고 노선 선택이 열려요.<br>선택하지 않아도 자동으로 입차해요.<br>시간제한 없이 천천히 생각해도 괜찮아요.</p>`,'알겠어요',done);}
$('#howto').onclick=()=>help();
function settings(){showModal('편안한 운행을 위해',`<div class="setting-row"><label for="music-toggle">배경음악</label><input id="music-toggle" type="checkbox" ${save.music?'checked':''}></div><p class="subtle">Lantern Lane Loop · James K<br>등불 골목을 위한 경쾌한 BGM · Suno로 제작</p><div class="setting-row music-volume"><label for="music-volume">음악 음량</label><input id="music-volume" aria-label="음악 음량" type="range" min="0" max="100" value="${Math.round(save.musicVolume*100)}"><output id="music-volume-value">${Math.round(save.musicVolume*100)}%</output></div><p id="music-status" class="subtle"></p><div class="setting-row"><label for="sound-toggle">효과음</label><input id="sound-toggle" type="checkbox" ${save.sound?'checked':''}></div><div class="setting-row music-volume"><label for="sound-volume">효과음 음량</label><input id="sound-volume" aria-label="효과음 음량" type="range" min="0" max="100" value="${Math.round(save.soundVolume*100)}"><output id="sound-volume-value">${Math.round(save.soundVolume*100)}%</output></div><div class="sfx-previews" aria-label="효과음 미리 듣기"><button data-sfx="select">차량 선택</button><button data-sfx="blocked">길 막힘</button><button data-sfx="arrival">도착</button><button data-sfx="board">탑승</button><button data-sfx="depart">만차 출발</button><button data-sfx="clear">클리어</button><button data-sfx="emergency">응급차</button></div><div class="setting-row"><label for="vibration-toggle">진동</label><input id="vibration-toggle" type="checkbox" ${save.vibration?'checked':''}></div><button id="settings-help" class="secondary">게임 방법</button><button id="settings-info" class="secondary">저장 및 서비스 안내</button><p class="subtle">버전 0.9.1 · 야시장 한입특급</p>`,'확인',hideModal);$('#music-toggle').onchange=e=>{save.music=e.target.checked;persist();syncMusic();music.unlock();};$('#music-volume').oninput=e=>{save.musicVolume=Number(e.target.value)/100;$('#music-volume-value').textContent=`${e.target.value}%`;persist();syncMusic();};$('#sound-toggle').onchange=e=>{save.sound=e.target.checked;persist();syncMusic();sfx.unlock().then(()=>beep());};$('#sound-volume').oninput=e=>{save.soundVolume=Number(e.target.value)/100;$('#sound-volume-value').textContent=`${e.target.value}%`;persist();syncMusic();};document.querySelectorAll('[data-sfx]').forEach(b=>b.onclick=()=>{syncMusic();sfx.unlock().then(()=>sfx.play(b.dataset.sfx));});$('#vibration-toggle').onchange=e=>{save.vibration=e.target.checked;persist();haptic();};$('#settings-help').onclick=()=>help(settings);$('#settings-info').onclick=()=>showModal('저장 및 서비스 안내','<p>계정 없이 플레이하며 진행·코인·설정은 이 기기의 브라우저에 저장됩니다. 다른 기기와 동기화되지 않습니다.</p><p>운행 중에는 차량과 손님의 이동이 끝난 시점을 저장합니다. 새로고침하면 마지막 저장 지점에서 이어할 수 있습니다.</p><p class="subtle">현재 공개 웹 체험판입니다. 실제 광고 서비스가 연결되지 않은 환경에서는 확장 버튼에 테스트 광고임을 표시합니다. 유료 결제는 제공하지 않습니다.</p>','설정으로 돌아가기',settings);}
$('#lobby-settings').onclick=settings;
function requestStart(index){
 if(index<0||index>save.unlocked)return;
 if(market?.state.status==='playing'&&market.state.moves>0){showModal('새 운행을 시작할까요?','<p>진행 중인 운행은 처음부터 다시 시작하게 됩니다. 완료한 단계와 코인은 유지됩니다.</p><button id="keep-run" class="secondary">진행 중인 운행 이어하기</button>','새 운행 시작',()=>start(index));$('#keep-run').onclick=resume;}else start(index);
}
function start(index,practice=false){
 hideModal();market=new Market(index);run={hints:0,undos:0,seconds:0,practice};if(!practice){save.level=index;persist();}finished=false;selected=null;checkpointSignature='';queueSignature='';
 enterGame();checkpointRun();beep();if(!save.tutorial)help(()=>{save.tutorial=true;persist();hideModal();});else if(index%10===0)toast(`${DISTRICTS[districtFor(index)].name}에 도착했어요 · ${stageProfile(index).colors}색 셔틀`,4000);else toast(market.state.garage?'차고의 다음 셔틀과 입차 예고를 확인하세요.':'덜 탄 차는 다음 같은 색 손님을 기다려요.');
}
function enterGame(){sfx.stop();market.onEvent=e=>sfx.play(e.type);comboShown=market.state.combo?.chain||0;comboUntil=0;$('#combo-banner').classList.remove('show');hideModal();view='game';$('#lobby').hidden=true;$('#game').hidden=false;targets();$('#game-level').textContent=`${run?.practice?'차고 체험':(market.state.levelIndex+1)+'단계'} · ${DISTRICTS[districtFor(market.state.levelIndex)].name}`;}
function resume(){if(!market)return;enterGame();}
$('#garage-trial').onclick=()=>{practiceReturn={market,run,finished};start(10,true);toast('8대 배차 후 진입로가 열리면 응급차가 들어와요.',5000);};
$('#play').onclick=()=>requestStart(save.level);$('#continue').onclick=resume;
function targets(){
 $('#car-targets').replaceChildren();for(const car of market.state.cars){const p=carPose(car,market.state),b=document.createElement('button');b.className='car-target';b.dataset.carId=car.id;b.style.cssText=`left:${(p.x-20)/6}%;top:${(p.y-25)/10.8}%;width:7%;height:4%`;b.setAttribute('aria-label',`${car.emergency?"응급차 · ":""}${COLORS[car.color].label} ${VEHICLE_MODELS[car.model||car.type].label}, ${CAPACITY[car.type]}인승, ${canExit(market.state,car)?'이동 가능':'길 막힘'}`);b.onclick=()=>dispatch(car.id);$('#car-targets').append(b);}
 $('#locked-targets').replaceChildren();for(let i=market.state.bays.length;i<7;i++){const b=document.createElement('button');b.className='locked-target';b.style.left=`${(BAY(i).x-30)/6}%`;b.setAttribute('aria-label',`광고 보고 승강장 ${i+1}번 칸 열기`);b.onclick=reward;$('#locked-targets').append(b);}$('#ad').disabled=market.state.bays.length>=7;
}
function renderQueue(){const color=market.state.queue[0],signature=`${color}:${market.state.queue.length}`;if(signature===queueSignature)return;queueSignature=signature;$('#queue-summary').textContent=color?`맨 앞 ${COLORS[color].short} ${COLORS[color].label}`:'모두 탑승했어요!';$('#queue-summary').style.setProperty('--cargo-color',color?COLORS[color].hex:'#fff0cc');}
function dispatch(id){if(view!=='game'||adBusy||!$('#modal').hidden)return;checkpointRun();const result=market.dispatch(id);if(!result.ok){sfx.play('blocked');toast(result.reason==='emergency-wait'?'마지막 배차의 탑승이 끝나면 판정해요. 잠시 기다려 주세요.':result.reason==='incoming'?'새 셔틀이 주차할 때까지 잠시 기다려 주세요.':result.reason==='blocked'?'화살표 앞을 막은 차부터 꺼내주세요.':'승강장이 가득 찼어요. 되돌려서 길을 열어 보세요.');selected={id,until:market.time+.5};return;}haptic();sfx.play('select');targets();}
$('#scene').addEventListener('pointerup',e=>{if(!market)return;const r=$('#scene').getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car)dispatch(car.id);});
function undo(){if(market.undo()){sfx.stop();beep();run.undos++;finished=false;targets();hideModal();checkpointRun();toast('배차 전으로 돌아왔어요.');}else toast('주행과 탑승이 끝나면 되돌릴 수 있어요.');}
$('#undo').onclick=undo;
$('#guide').onclick=()=>{const request=market.garageTransfer();if(request?.ready){toast(`${COLORS[request.car.color].label} 셔틀은 차고에 있어요. 빈 승강장으로 자동 진입합니다.`,4000);return;}const car=market.readySuggestion();if(!car){toast('이동 중인 셔틀을 기다려 주세요.');return;}run.hints++;selected={id:car.id,until:market.time+3};toast(`${COLORS[car.color].label} ${VEHICLE_MODELS[car.model||car.type].label}의 길이 열려 있어요.`,3000);};
function pause(){sfx.stop();showModal(`${market.state.levelIndex+1}단계 · 잠시 쉬어가기`,'<p>지금은 운행이 멈춰 있습니다.</p><button class="secondary" id="pause-retry">이 단계 다시 시작</button><button class="secondary" id="pause-home">대기실로 돌아가기</button><button class="secondary" id="pause-settings">설정</button>','계속 운행하기',hideModal);$('#pause-retry').onclick=()=>showModal('다시 시작할까요?','<p>이번 단계의 차량과 손님이 처음 위치로 돌아갑니다.</p>','다시 시작',()=>start(market.state.levelIndex,!!run.practice));$('#pause-home').onclick=()=>showLobby('home');$('#pause-settings').onclick=settings;}
$('#settings').onclick=pause;$('#town').onclick=()=>showLobby('home');
async function reward(){
 if(adBusy||market.state.bays.length>=7||market.state.status==='won')return;
 const actual=!!window.PickupRushAds?.showRewarded;
 showModal('승강장 한 칸 더',`<p>완료하면 이번 단계에서 승강장 한 칸을 더 쓸 수 있어요.</p><p class="subtle">${actual?'보상형 광고':'웹 체험판 · 3초 테스트 광고'}<br>승강장 확장을 사용한 완료는 별 1개를 받습니다.</p><div class="ad-progress"><div id="ad-progress"></div></div>`,actual?'광고 보기':'테스트 광고 보기',async()=>{
  adBusy=true;syncMusic();$('#primary').disabled=true;$('#close').hidden=true;
  try{const r=await platform.requestRewardedAd(p=>$('#ad-progress').style.transform=`scaleX(${p})`);if(r.rewarded){market.addBay();finished=false;targets();checkpointRun();toast(`승강장 ${market.state.bays.length}칸으로 확장했어요.`);}else toast('광고가 완료되지 않아 보상이 지급되지 않았어요.');}catch{toast('광고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');}finally{adBusy=false;syncMusic();$('#close').hidden=false;hideModal();if(market.state.status==='lost')finished=false;}
 });
}
$('#ad').onclick=reward;
function finish(){
 finished=true;
 if(market.state.status==='won'){
  if(run.practice){sfx.play('clear');showModal('차고 체험 완료!','<p>새 셔틀의 입차까지 모두 정리했어요.</p><p class="subtle">본 운행 11단계부터 차고가 등장합니다.<br>기존 운행과 기록은 그대로 유지됩니다.</p>','대기실로',()=>showLobby('home'));return;}
  const n=market.state.levelIndex,result=complete(save,n,{...run,bays:market.state.bays.length,passengers:market.total,combo:market.state.combo?.best||0,emergency:market.state.emergency?.status==='success'});persist();clearSession();sfx.play('clear');
  showModal(result.all?'모든 골목을 밝혔어요!':'야시장에 도착했어요!',`<div class="result-stars" aria-label="별 ${result.stars}개">${'★'.repeat(result.stars)}${'☆'.repeat(3-result.stars)}</div><p>${market.total}명의 손님과 함께한 ${n+1}번째 정류장</p><div class="result-stats"><span>운행 시간<b>${Math.floor(run.seconds/60)}:${String(Math.floor(run.seconds%60)).padStart(2,'0')}</b></span><span>획득 코인<b>+${result.reward}</b></span></div>${result.emergencyReward?`<p class="growth-result">긴급 운행 성공 · 보너스 +${result.emergencyReward}코인</p>`:""}<p class="combo-result">최고 ${result.combo}연속 만차${result.comboReward?` · 콤보 보너스 +${result.comboReward}코인`:""}</p>${n%10===9&&result.fresh?`<p class="growth-result">✦ ${marketGrowth(save).regions[Math.floor(n/10)].name} 오픈!<br>대기실 야시장이 더 밝아졌어요.</p>`:""}<p class="subtle">${result.stars===3?'도움 없이 기본 4칸으로 완주했어요!':result.stars===2?'기본 4칸으로 완주했어요. 도움 없이 도전하면 별 3개!':'다음에는 기본 4칸으로 도전해 보세요.'}</p><button id="result-home" class="secondary">대기실로 돌아가기</button>`,n<TOTAL_LEVELS-1?'다음 단계 출발':'여정 둘러보기',()=>{if(n<TOTAL_LEVELS-1)start(n+1);else showLobby('map');});$('#result-home').onclick=()=>showLobby('home');
 }else{
  sfx.play('lose');showModal('승강장이 모두 찼어요','<p>줄 맨 앞 손님과 같은 색 셔틀이 없어요.<br>되돌려서 필요한 차가 들어올 자리를 만들어 보세요.</p><button id="lost-undo" class="secondary">무료 되돌리기</button><button id="lost-ad" class="secondary">광고로 승강장 +1</button><button id="lost-home" class="secondary">대기실로 돌아가기</button>','무료 다시 도전',()=>start(market.state.levelIndex,!!run.practice));$('#lost-undo').disabled=!market.canUndo;$('#lost-undo').onclick=undo;$('#lost-ad').disabled=market.state.bays.length>=7;$('#lost-ad').onclick=reward;$('#lost-home').onclick=()=>showLobby('home');
 }
}
let lobbyFrame=0;
function frame(now){
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 if(view==='game'&&market){
  if($('#modal').hidden&&!document.hidden){market.tick(dt);run.seconds+=dt;}
  const board=market.state.cars.map(c=>c.id).join(',');if(board!==boardSignature){boardSignature=board;targets();}renderGarage();renderCombo(now);renderEmergency();
  scene.reduceMotion=reduced.matches;scene.decoration=save.decoration;scene.draw(market,selected);renderQueue();
  $('#coin-count').textContent=save.coins;$('#hint').textContent=`${market.delivered}/${market.total}명 탑승 · 승강장 ${market.state.bays.length}/7 · ${market.state.moves}번 배차`;
  $('#undo').disabled=!market.canUndo;$('#game').dataset.status=market.state.status;$('#game').dataset.completed=market.delivered;
  const signature=`${market.state.garage?.arrived||0}:${market.state.moves}:${market.delivered}:${market.state.bays.filter(Boolean).length}:${Math.floor(run.seconds/5)}`;
  if(!market.busy&&signature!==checkpointSignature){checkpointRun();checkpointSignature=signature;}
  if(market.state.status!=='playing'&&!finished)finish();
 }else if(now-lobbyFrame>65){const art=$('#lobby-art');if(!art.complete||!art.naturalWidth)lobbyScene.draw(now/1000,save.decoration,reduced.matches);lobbyFrame=now;}
 const status=$('#music-status');if(status)status.textContent=music.status==='error'?'음악을 불러오지 못했어요. 연결을 확인해 주세요.':music.status==='playing'?`재생 중 · ${TRACKS[music.current].title}`:!save.music?'배경음악 꺼짐':'화면을 누르면 음악이 재생됩니다.';
 if(now>toastUntil)$('#toast').classList.remove('show');requestAnimationFrame(frame);
}
function syncMusic(){sfx.configure({enabled:save.sound,volume:save.soundVolume,suspended:document.hidden||adBusy});music.configure({enabled:save.music,volume:save.musicVolume,track:save.musicTrack,level:view==='game'?market.state.levelIndex:0,suspended:document.hidden||adBusy,ducked:view==='game'&&!$('#modal').hidden});}
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{syncMusic();sfx.unlock();music.unlock();},{capture:true});
setInterval(syncMusic,500);
function renderGarage(){
 const button=$('#garage-preview');button.hidden=!market.state.garage;if(button.hidden)return;
 const status=garageStatus(market.state,market.arriving),request=market.garageTransfer(),incoming=market.running.find(c=>c.fromGarage&&c.phase==='driving'),signature=JSON.stringify([status,request,incoming?.id]);
 if(signature===garageSignature)return;garageSignature=signature;
 button.classList.toggle('auto-entry',!!request||!!incoming);
 if(incoming){const color=COLORS[incoming.color];button.style.setProperty('--car-color',color.hex);button.innerHTML=`<b>${color.short} ${color.label} 셔틀 · 자동 진입 중</b><span>승강장으로 이동</span>`;button.setAttribute('aria-label',`${color.label} 셔틀이 승강장으로 자동 진입 중입니다.`);return;}
 if(request){
  const color=COLORS[request.car.color];button.style.setProperty('--car-color',color.hex);
  const action=request.ready?'자동 진입 준비':market.busy?'운행 후 자동 진입':'빈 승강장 대기';
  button.innerHTML=`<b>${color.short} ${color.label} 셔틀 · 차고에 대기</b><span>${action}</span>`;
  button.setAttribute('aria-label',`${color.label} 셔틀이 차고에 있습니다. ${action}`);return;
 }
 const options=routeOptions(market.state),preferred=status.wave?.cars.find(c=>c.id===status.wave.preferredId);button.classList.toggle('route-available',options.length>0);
 button.innerHTML=`<b>${options.length?'갈림길 노선 · 먼저 올 셔틀 선택':preferred?`${COLORS[preferred.color].label} 우선 · ${status.text}`:status.text}</b><span>${status.wave?status.wave.cars.slice(0,5).map(c=>`<i style="--car-color:${COLORS[c.color].hex}" aria-hidden="true">${c.type==='bus'?'▰':c.type==='van'?'▣':'▪'}</i>`).join(''):'✓'} <small>${status.pending}대 남음</small></span>`;
 button.setAttribute('aria-label',`${options.length?'차고 노선 선택. ':''}${status.text}, ${status.pending}대 남음. 다음 차량 보기`);
}
$('#garage-preview').onclick=()=>{
 if(view!=='game'||adBusy||!$('#modal').hidden)return;
 const choices=routeOptions(market.state);if(choices.length){showRouteChoice(choices);return;}
 const s=garageStatus(market.state,market.arriving);showModal('차고 입차 예고',`<p>${s.text}</p><div class="arrival-list">${market.state.garage.waves.map((w,i)=>`<article><b>${i+1}차 · 차고 ${w.gate?'B':'A'}</b><small>${w.trigger}대 배차 후, 진입로가 비면</small><div>${w.cars.map(c=>`<span style="--car-color:${COLORS[c.color].hex}">${COLORS[c.color].short} ${COLORS[c.color].label} ${VEHICLE_MODELS[c.model].label}</span>`).join('')||'입차 완료'}</div></article>`).join('')}</div><p class="subtle">맨 앞 손님의 색이 차고에만 남으면<br>빈 승강장으로 자동 진입해요.<br>버튼을 누를 필요 없이 기다리면 됩니다.</p>`,'확인',hideModal);
};
document.addEventListener('visibilitychange',syncMusic);
window.addEventListener('resize',()=>{scene.resize();lobbyScene.resize();});document.addEventListener('visibilitychange',()=>{last=0;checkpointRun();});window.addEventListener('pagehide',checkpointRun);
showLobby();syncMusic();if(restored&&market.demandVersion<5)toast('새 색상은 새 운행부터 적용돼요. 기존 판은 그대로 이어져요.',5000);requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=42').catch(()=>{});

function renderCombo(now){
 const chain=market.state.combo?.chain||0;
 if(chain!==comboShown){
  if(chain>=2){$('#combo-banner').innerHTML=`<small>연속 만차 출발</small><b>${chain} COMBO <span>✦</span></b>`;comboUntil=now+2400;sfx.play('combo');}
  else comboUntil=0;
  comboShown=chain;
 }
 $('#combo-banner').classList.toggle('show',now<comboUntil);
}
function stallDrawing(region,x){
 const lit=region.cleared===10,color=['#efb968','#e6a0b2','#71c4b9','#a49bd4'][region.index%4];
 return `<g transform="translate(${x} 4)" opacity="${lit?1:.3}"><rect x="1" y="22" width="28" height="32" rx="3" fill="${lit?'#f6deab':'#71808a'}"/><path d="M0 22 4 11h22l4 11Z" fill="${color}"/><path d="M6 12v10m9-10v10m9-10v10" stroke="#fff2d4" stroke-width="3" opacity=".6"/><rect x="6" y="30" width="18" height="12" rx="2" fill="${lit?'#ffd269':'#31485a'}"/><path d="M5 49h20" stroke="${color}" stroke-width="3"/>${lit?'<circle cx="15" cy="4" r="3" fill="#ffd88b"/>':''}</g>`;
}
function renderGrowth(){
 const growth=marketGrowth(save),button=$('#market-growth');
 button.innerHTML=`<span><b>나의 야시장</b><small>${growth.opened} / 10 가게 오픈 <i>↗</i></small></span><svg viewBox="0 0 340 63" aria-hidden="true">${growth.regions.map((r,i)=>stallDrawing(r,i*34)).join('')}</svg>`;
 button.setAttribute('aria-label',`나의 야시장, 가게 ${growth.opened}개 오픈. 성장 현황 보기`);
}
function showGrowth(){
 const g=marketGrowth(save);
 showModal('조금씩 밝아지는 우리 야시장',`<p>지역의 10단계를 모두 마치면 가게가 열려요.<br>장식은 무료로 쌓이고 게임 규칙은 그대로예요.</p><div class="growth-grid">${g.regions.map(r=>`<article class="${r.cleared===10?'open':''}"><svg viewBox="0 0 34 63" aria-hidden="true">${stallDrawing(r,2)}</svg><b>${r.name}</b><small>${r.cleared===10?'영업 중 ✦':`${r.index*10+1}–${r.index*10+10}단계 · ${r.cleared}/10 완료`}</small></article>`).join('')}</div>`,'다음 골목으로',()=>{hideModal();district=districtFor(save.level);showLobby('map');});
}
$('#market-growth').onclick=showGrowth;
function showRouteChoice(choices){
 showModal('다음 셔틀, 어느 노선부터?',`<p>길이 열리면 고른 셔틀이 먼저 입차해요.</p><div class="route-choices">${choices.map(c=>`<button data-route-car="${c.id}" style="--route-color:${COLORS[c.color].hex}"><span>${COLORS[c.color].short}</span><b>${COLORS[c.color].label} ${VEHICLE_MODELS[c.model||c.type].label}</b><small>${CAPACITY[c.type]}인승 · 우선 입차</small></button>`).join('')}</div><p class="subtle">선택은 무료이고 시간제한도 없어요.<br>선택하지 않으면 원래 순서로 자동 입차합니다.<br>길이 막히면 다른 차량부터, 맨 앞 손님의 색이 차고에만 있으면 해당 차량부터 들어와요.</p>`,'원래 순서로 계속',hideModal);
 document.querySelectorAll('[data-route-car]').forEach(b=>b.onclick=()=>{
  const car=choices.find(c=>String(c.id)===b.dataset.routeCar);
  if(car&&chooseRoute(market.state,car.id)){market.garageCheckKey=null;garageSignature='';checkpointRun();hideModal();renderGarage();toast(`${COLORS[car.color].label} 노선 선택 완료 · 입차는 자동이에요.`);}
 });
}

function emergencyDetails(){
 const e=market?.state.emergency;if(!e)return;
 const color=COLORS[e.color],car=market.state.bays.find(c=>c?.id===e.id),loaded=car?.loaded||0;
 const active=e.status==='active';
 showModal(active?'긴급 운행 요청!':e.status==='success'?'긴급 운행 성공!':'긴급 운행 시간이 지났어요',
  `<div class="emergency-card" style="--target-color:${color.hex}"><b>🚑 ${color.short} ${color.label} 손님</b><strong>${active?`${loaded} / ${e.capacity}명 · ${e.remaining}번 배차 남음`:e.status==='success'?'전원 탑승 · 출발 완료':'보너스 도전 종료'}</strong></div><p>${active?'흰 차체의 응급차에 같은 색 손님을 모두 태워 출발시켜 주세요. 손님은 기존 줄 순서대로 탑승해요.':e.status==='success'?'단계를 클리어하면 긴급 운행 보너스 20코인을 받아요. 단계당 한 번 지급됩니다.':'코인이나 별을 잃지 않아요. 응급차도 일반 셔틀처럼 남은 손님을 태우며 운행을 계속합니다.'}</p><p class="subtle">${active?'차량을 성공적으로 배차할 때만 1턴 차감.<br>기다리기 · 길 막힘 · 자동 입차는 차감되지 않아요.<br>마지막 턴의 탑승과 출발까지 판정해요.':run.practice?'체험에서는 코인과 기록이 바뀌지 않아요.':''}</p>`,active?'긴급 운행 시작':'계속 운행하기',hideModal);
}
function renderEmergency(){
 const e=market.state.emergency,hud=$('#emergency-hud');hud.hidden=!e;if(!e)return;
 const c=COLORS[e.color],car=market.state.bays.find(car=>car?.id===e.id);
 hud.style.setProperty('--target-color',c.hex);hud.classList.toggle('urgent',e.status==='active'&&e.remaining<=2);
 hud.innerHTML=`<strong>🚑 ${c.short} ${c.label} ${e.status==='success'?e.capacity:car?.loaded||0}/${e.capacity}</strong><span>${e.status==='active'?`${e.remaining}턴 남음`:e.status==='success'?'긴급 운행 성공':'도전 종료'}</span>`;
 hud.setAttribute('aria-label',`긴급 운행 ${c.label}, ${e.status==='active'?e.remaining+'번 배차 남음':e.status==='success'?'성공':'도전 종료'}`);
 if(!$('#modal').hidden||document.hidden||market.state.status!=='playing')return;
 if(!e.announced){e.announced=true;sfx.play('emergency');emergencyDetails();}
 else if(e.status!=='active'&&!e.resultSeen&&!market.busy){e.resultSeen=true;sfx.play(e.status==='success'?'combo':'lose');emergencyDetails();checkpointRun();}
}
$('#emergency-hud').onclick=emergencyDetails;
