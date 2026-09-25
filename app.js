import {timeTargets,formatTime,timerState} from './timing.js?v=54';
import {claimEventReward,EVENT_REWARDS} from './mission-rewards.js?v=54';
import {ITEMS,BUNDLE,purchase,useItem,itemAvailability,navigationSuggestion,queueGroups} from './items.js?v=54';
import {cutActive} from './queue-cut.js?v=54';
import {exitBlockers,hiddenCar} from './puzzle.js?v=54';
import {SoundEffects,EFFECT_NAMES,bindInteractionSounds} from './sfx.js?v=54';
import {pendingCars,garageStatus,routeOptions,chooseRoute} from './garage.js?v=54';
import {MusicPlayer,TRACKS} from './music.js?v=54';
import {LEVELS_PER_DISTRICT,districtFor,stageProfile} from './campaign.js?v=54';
import {Market,MARKET_LEVELS,DISTRICTS,STALL_ICONS} from './market.js?v=54';
import {MarketScene} from './market-scene.js?v=54';
import {LobbyScene} from './lobby-scene.js?v=54';
import {carPose,BAY,CAPACITY} from './traffic.js?v=54';
import {canExit,COLORS,LEVELS} from './game.js?v=54';
import {FLEET_STYLES,REGION_FLEETS,fleetFor,fleetStyles,vehicleLabel,styleDebut} from './fleet.js?v=54';
import {platform} from './platform.js?v=54';
import {normalize,complete,buyTheme,claimMission,MISSIONS,THEMES,TOTAL_LEVELS,marketGrowth} from './progress.js?v=54';
import {checkpoint,restoreSession} from './session.js?v=54';
const $=s=>document.querySelector(s),SAVE='night-bite-market-v1',SESSION='night-bite-session-v1';
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
const rawSave=read(SAVE);
let save=normalize(rawSave),market=null,run=null,view='home',tab='home',district=districtFor(save.level),selected=null,last=0,finished=false,adBusy=false,toastUntil=0,returnFocus=null,primaryAction=null,checkpointSignature='',queueSignature='',practiceReturn=null,boardSignature='',garageSignature='',comboShown=0,comboUntil=0;
let fleetDistrict=districtFor(save.level);
const sfx=new SoundEffects();
const music=new MusicPlayer();music.audio.id='bgm-audio';music.audio.hidden=true;document.body.append(music.audio);
const scene=new MarketScene($('#scene')),lobbyScene=new LobbyScene($('#lobby-scene')),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const restored=restoreSession(rawSave&&Object.hasOwn(rawSave,'activeSession')?rawSave.activeSession:read(SESSION),save.unlocked);if(restored){market=restored.market;run=restored.run;}
function toast(text,duration=2400){$('#toast').textContent=text;$('#toast').classList.add('show');toastUntil=performance.now()+duration;}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(save));}catch{toast('저장 공간이 부족해 진행을 저장하지 못했어요.');}}
function checkpointRun(){if(!market||!run||run.practice)return;const data=checkpoint(market,run);if(data){save.activeSession=data;persist();}}
function clearSession(){save.activeSession=null;persist();try{localStorage.removeItem(SESSION);}catch{}}
bindInteractionSounds(document,sfx,()=>!adBusy&&!document.hidden);
function beep(success=false){sfx.play(success?'reward':'ui');}
function haptic(){if(save.vibration)platform.haptic();}
function showModal(title,body,label,action){
 $('#modal').dataset.stageStart='false';$('#close').setAttribute('aria-label','닫기');
 if($('#modal').hidden)returnFocus=document.activeElement;
 $('#modal-title').textContent=title;$('#modal-body').innerHTML=body;$('#primary').textContent=label;$('#primary').disabled=false;primaryAction=action;
 $('#modal').hidden=false;$('#lobby').inert=true;$('#game').inert=true;$('#primary').focus({preventScroll:true});$('#modal section').scrollTop=0;
}
function hideModal(){if(adBusy)return;$('#modal').hidden=true;$('#lobby').inert=!$('#loading').hidden;$('#game').inert=!$('#loading').hidden;primaryAction=null;returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});}
$('#primary').onclick=()=>{if(!adBusy)primaryAction?.();};
$('#close').onclick=()=>{if(adBusy)return;if($('#modal').dataset.stageStart==='true'){showLobby('home');return;}hideModal();if(finished)showLobby('home');};
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
 sfx.stop();if(next==='garage')fleetDistrict=districtFor(save.level);
 if(run?.practice&&practiceReturn){({market,run,finished}=practiceReturn);practiceReturn=null;}
 checkpointRun();hideModal();view='home';tab=next;$('#lobby').hidden=false;$('#game').hidden=true;
 $('#home-content').hidden=next!=='home';$('#lobby-panel').hidden=next==='home';
 document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 home();if(next!=='home'){renderPanel();$('#lobby-panel').scrollTop=0;}
}
const headings={shop:['READY FOR THE RUSH','셔틀 보급소','모은 코인으로 막힌 순간을 풀어 줄 아이템을 준비하세요.'],map:['YOUR NIGHT JOURNEY','오늘은 어느 골목으로?','20개 지역, 200번의 밤을 한 단계씩 여행해요.'],garage:['MEET YOUR SHUTTLES','지역별 셔틀 도감','20개의 거리, 다양한 차량 조합. 다음 골목에서 만날 셔틀을 구경하세요.'],records:['YOUR LITTLE ACHIEVEMENTS','우리의 운행 기록','한 번의 출발이 모여 야시장을 밝힙니다.']};
function renderPanel(){
 const [k,title,desc]=headings[tab];$('#panel-kicker').textContent=k;$('#panel-title').textContent=title;$('#panel-description').textContent=desc;
 const body=$('#panel-body');
 if(tab==='map'){
  body.innerHTML=`<div class="district-picker"><button id="previous-district" aria-label="이전 지역" ${district===0?'disabled':''}>‹</button><select id="district-select" aria-label="여행 지역 선택">${DISTRICTS.map((d,i)=>`<option value="${i}" ${i===district?'selected':''}>${String(i+1).padStart(2,'0')} · ${d.name} (${i*10+1}–${i*10+10}단계)</option>`).join('')}</select><button id="next-district" aria-label="다음 지역" ${district===DISTRICTS.length-1?'disabled':''}>›</button></div><div class="route-note">${DISTRICTS[district].subtitle}<span>${save.cleared.filter(i=>districtFor(i)===district).length}/${LEVELS_PER_DISTRICT} 완료</span></div><p class="difficulty-note">차량 ${stageProfile(district*10).count}–${stageProfile(district*10+9).count}대 · ${stageProfile(district*10).colors}–${stageProfile(district*10+9).colors}색 · 난이도 ${district*10+1}–${district*10+10}</p><div class="level-grid">${Array.from({length:LEVELS_PER_DISTRICT},(_,i)=>{const n=district*LEVELS_PER_DISTRICT+i,open=n<=save.unlocked;return `<button class="level-node ${n===save.level?'current':''} ${n%10===9?'challenge':''}" data-level="${n}" ${open?'':'disabled'} aria-label="${n+1}단계 ${stageProfile(n).rhythm}, ${open?'시작':'잠김'}, 별 ${save.stars[n]||0}개"><b>${open?(n%10===9?'✦ ':'')+(n+1):'♙'}</b><span>${open?'★'.repeat(save.stars[n]||0)+'☆'.repeat(3-(save.stars[n]||0)):`${n}단계 완료 후`}</span></button>`;}).join('')}</div><p class="panel-foot">★★★ 목표 시간 이내 · ★★ 목표의 1.5배 이내 · ★ 이후 완료<br>이미 받은 별 보상은 중복 지급되지 않아요.</p>`;
  $('#district-select').onchange=e=>{district=Number(e.target.value);renderPanel();sfx.play('ui');};$('#previous-district').onclick=()=>{district--;renderPanel();};$('#next-district').onclick=()=>{district++;renderPanel();};body.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>requestStart(Number(b.dataset.level)));
 }else if(tab==='shop'){
  renderShop(body);
 }else if(tab==='garage'){
  const index=fleetDistrict*10,ids=fleetStyles(index),fleet=fleetFor(index);
  body.innerHTML=`<div class="district-picker"><button id="fleet-prev" aria-label="이전 차량 지역" ${fleetDistrict===0?'disabled':''}>‹</button><select id="fleet-region" aria-label="차량 지역 선택">${REGION_FLEETS.map((f,i)=>`<option value="${i}" ${i===fleetDistrict?'selected':''}>${i*10+1}–${i*10+10}단계 · ${DISTRICTS[i].name}</option>`).join('')}</select><button id="fleet-next" aria-label="다음 차량 지역" ${fleetDistrict===REGION_FLEETS.length-1?'disabled':''}>›</button></div><div class="fleet-heading"><small>${index<=save.unlocked?'운행 가능한 지역':'앞으로 만날 차량 · 미리 보기'}</small><h2>${fleet.name}</h2><p>같은 지역에서도 판마다 차량 조합이 달라져요.</p></div><div class="garage-grid fleet-grid">${ids.map(id=>{const m=FLEET_STYLES[id];return `<article class="vehicle-card"><canvas width="220" height="120" data-fleet="${id}" aria-label="${m.label} 외형"></canvas><div><strong>${m.label}</strong><span>${CAPACITY[m.type]}인승</span></div><small class="fleet-debut">${styleDebut(id)}단계부터 등장</small><p>${m.description}</p></article>`;}).join('')}</div><p class="panel-foot">차량은 단계에 맞춰 무료로 등장합니다.<br>작은 차 4명 · 중간 차 6명 · 큰 버스 10명<br>같은 색 손님을 태우는 규칙은 그대로예요.</p>`;
  $('#fleet-prev').onclick=()=>{fleetDistrict--;renderPanel();};$('#fleet-next').onclick=()=>{fleetDistrict++;renderPanel();};$('#fleet-region').onchange=e=>{fleetDistrict=Number(e.target.value);renderPanel();sfx.play('ui');};
  for(const canvas of body.querySelectorAll('canvas')){const id=canvas.dataset.fleet,style=FLEET_STYLES[id],type=style.type,model=style.kind==='sedan'?'sedan':style.kind==='taxi'?'taxi':style.kind==='suv'?'suv':type==='bus'?'bus':'van';const preview=new MarketScene(canvas);canvas.width=440;canvas.height=240;preview.c.setTransform(3.6,0,0,3.6,-176,-92);preview.vehicle({model,type,previewStyle:id,color:{taxi:'yellow',van:'green',bus:'blue'}[type]}, {x:110,y:77,angle:-.28});}
 }else{
  const stars=Object.values(save.stars).reduce((a,b)=>a+b,0);
  body.innerHTML=`<div class="record-grid"><article><span>여행한 단계</span><b>${save.cleared.length}<small> / ${TOTAL_LEVELS}</small></b></article><article><span>모은 별</span><b>${stars}<small> / ${TOTAL_LEVELS*3}</small></b></article><article><span>손님 수송</span><b>${save.boarded.toLocaleString()}<small>명</small></b></article><article><span>완료한 운행</span><b>${save.wins}<small>회</small></b></article></div><h2 class="small-heading">골목별 발자취</h2>${DISTRICTS.map((d,i)=>{const n=save.cleared.filter(l=>districtFor(l)===i).length;return `<div class="district-record"><span>${d.icon}</span><div><b>${d.name}</b><progress value="${n}" max="${LEVELS_PER_DISTRICT}" aria-label="${d.name} ${n}/${LEVELS_PER_DISTRICT} 완료"></progress></div><strong>${n}/${LEVELS_PER_DISTRICT}</strong></div>`;}).join('')}<button class="secondary" id="records-missions">운행 미션 보상 확인</button><p class="panel-foot">기록은 이 기기에 저장됩니다.<br>브라우저 데이터를 삭제하면 기록도 삭제됩니다.</p>`;$('#records-missions').onclick=missions;
 }
}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>showLobby(b.dataset.tab);
$('#wallet').onclick=()=>showLobby('shop');$('#profile').onclick=()=>showLobby('records');
$('#home-map').onclick=()=>{district=districtFor(save.level);showLobby('map');};
function missions(){showModal('오늘도 한 걸음',`<div class="mission-list">${MISSIONS.map(m=>`<article><div><strong>${m.name}</strong><small>${m.description}</small><progress value="${Math.min(m.target,m.value(save))}" max="${m.target}"></progress><small>${Math.min(m.target,m.value(save))}/${m.target}</small></div><button data-claim="${m.id}" ${save.claimed.includes(m.id)||m.value(save)<m.target?'disabled':''}>${save.claimed.includes(m.id)?'받음':`● ${m.reward}`}</button></article>`).join('')}</div>`,'확인',hideModal);document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{if(claimMission(save,b.dataset.claim)){persist();home();missions();beep(true);}});}
$('#missions').onclick=missions;
function help(done=hideModal){showModal('야시장행 셔틀 안내',`<div class="tutorial"><div><b>1</b><p><strong>맨 앞 손님의 옷 색을 보세요.</strong><br>같은 색 셔틀에만 탈 수 있어요.</p></div><div><b>2</b><p><strong>화살표 앞이 열린 차를 꺼내요.</strong><br>다른 차가 막으면 먼저 길을 열어 주세요.</p></div><div><b>3</b><p><strong>가득 차면 야시장으로 출발!</strong><br>덜 탄 차는 다음 같은 색 손님을 기다려요.</p></div></div><p class="subtle">승강장 기본 4칸 · 최대 7칸<br>11단계부터 차고의 응급차가 등장해요.<br>지정 색 손님을 태워 6→5→4번 배차 안에 출발하면 즉시 +20코인(단계별 첫 성공)!<br>실패해도 운행은 계속됩니다.<br>다음 배차 전 만차 출발이 이어지면 콤보!<br>15단계부터 5단계마다 차고 노선 선택이 열려요.<br>선택하지 않아도 자동으로 입차해요.<br>21단계부터: 가려진 셔틀은 앞길을 열면 색이 드러나요.<br>41단계부터: 열쇠 차가 주차장을 나가면 같은 번호 차단기가 열려요.<br>10단계마다 도전 운행, 다음 지역 첫 판은 적응 운행이에요.<br>5단계부터 새치기 손님이 맨 앞으로!<br>3번 배차 안에 태우면 즉시 +15코인(단계별 첫 성공).<br>놓치면 원래 줄로 돌아가요.<br>별은 완료 시간으로 정해져요. 아이템을 써도 별이 깎이지 않아요.<br>★★★ 목표 시간 이내 · ★★ 목표의 1.5배 이내 · ★ 이후 완료<br>일시정지·안내 팝업·광고·다른 앱 사용 중에는 시간이 멈춰요.</p>`,'알겠어요',done);}
$('#howto').onclick=()=>help();
function settings(){showModal('편안한 운행을 위해',`<div class="setting-row"><label for="music-toggle">배경음악</label><input id="music-toggle" type="checkbox" ${save.music?'checked':''}></div><p class="subtle">Lantern Lane Loop · James K<br>등불 골목을 위한 경쾌한 BGM · Suno로 제작</p><div class="setting-row music-volume"><label for="music-volume">음악 음량</label><input id="music-volume" aria-label="음악 음량" type="range" min="0" max="100" value="${Math.round(save.musicVolume*100)}"><output id="music-volume-value">${Math.round(save.musicVolume*100)}%</output></div><p id="music-status" class="subtle"></p><div class="setting-row"><label for="sound-toggle">효과음</label><input id="sound-toggle" type="checkbox" ${save.sound?'checked':''}></div><div class="setting-row music-volume"><label for="sound-volume">효과음 음량</label><input id="sound-volume" aria-label="효과음 음량" type="range" min="0" max="100" value="${Math.round(save.soundVolume*100)}"><output id="sound-volume-value">${Math.round(save.soundVolume*100)}%</output></div><div class="sfx-previews" aria-label="효과음 미리 듣기">${Object.entries(EFFECT_NAMES).map(([id,label])=>`<button data-sfx="${id}">${label}</button>`).join('')}</div><div class="setting-row"><label for="vibration-toggle">진동</label><input id="vibration-toggle" type="checkbox" ${save.vibration?'checked':''}></div><div class="setting-row"><label for="color-assist">색상 구분 기호</label><input id="color-assist" type="checkbox" ${save.colorAssist?'checked':''}></div><p class="subtle">승객 옷과 차량에 같은 기호를 표시해요.</p><button id="settings-puzzles" class="secondary">새 퍼즐 무료 체험</button><button id="settings-help" class="secondary">게임 방법</button><button id="settings-info" class="secondary">저장 및 서비스 안내</button><p class="subtle">버전 0.16.0 · 야시장 한입특급</p>`,'확인',hideModal);$('#music-toggle').onchange=e=>{save.music=e.target.checked;persist();syncMusic();music.unlock();sfx.play('ui');};$('#music-volume').oninput=e=>{save.musicVolume=Number(e.target.value)/100;$('#music-volume-value').textContent=`${e.target.value}%`;persist();syncMusic();};$('#sound-toggle').onchange=e=>{save.sound=e.target.checked;persist();syncMusic();sfx.unlock().then(()=>beep());};$('#sound-volume').oninput=e=>{save.soundVolume=Number(e.target.value)/100;$('#sound-volume-value').textContent=`${e.target.value}%`;persist();syncMusic();};document.querySelectorAll('[data-sfx]').forEach(b=>b.onclick=()=>{syncMusic();sfx.unlock().then(()=>sfx.play(b.dataset.sfx));});$('#sound-volume').onchange=()=>sfx.unlock().then(()=>sfx.play('ui'));$('#vibration-toggle').onchange=e=>{save.vibration=e.target.checked;persist();haptic();sfx.play('ui');};$('#color-assist').onchange=e=>{save.colorAssist=e.target.checked;persist();garageSignature='';sfx.play('ui');};$('#settings-puzzles').onclick=puzzleTrials;$('#settings-help').onclick=()=>help(settings);$('#settings-info').onclick=()=>showModal('저장 및 서비스 안내','<p>계정 없이 플레이하며 진행·코인·설정은 이 기기의 브라우저에 저장됩니다. 다른 기기와 동기화되지 않습니다.</p><p>운행 중에는 차량과 손님의 이동이 끝난 시점을 저장합니다. 새로고침하면 마지막 저장 지점에서 이어할 수 있습니다.</p><p class="subtle">현재 공개 웹 체험판입니다. 실제 광고 서비스가 연결되지 않은 환경에서는 확장 버튼에 테스트 광고임을 표시합니다. 유료 결제는 제공하지 않습니다.</p>','설정으로 돌아가기',settings);}
$('#lobby-settings').onclick=settings;
function requestStart(index){
 if(index<0||index>save.unlocked)return;
 if(market?.state.status==='playing'&&(market.state.moves>0||market.state.bays.length>4||Object.values(run?.tools||{}).some(Boolean))){showModal('새 운행을 시작할까요?','<p>진행 중인 운행은 처음부터 다시 시작하게 됩니다. 이번 판에 사용한 아이템 효과는 끝나며, 사용한 수량은 반환되지 않아요. 완료한 단계와 코인은 유지됩니다.</p><button id="keep-run" class="secondary">진행 중인 운행 이어하기</button>','새 운행 시작',()=>start(index));$('#keep-run').onclick=resume;}else start(index);
}
function start(index,practice=false){
 hideModal();market=new Market(index);run={hints:0,undos:0,seconds:0,practice,startPending:true};if(!practice){save.level=index;persist();}finished=false;selected=null;checkpointSignature='';queueSignature='';
 enterGame();checkpointRun();stageStart();
}
function enterGame(){sfx.stop();market.onEvent=e=>{if((e.type==='incoming'&&e.emergency)||e.type==='cutin')return;sfx.play(e.type);if(e.type==='reveal'){selected={id:e.carId,until:market.time+.7};toast('길이 열려 셔틀의 색이 드러났어요.',1800);}if(e.type==='gate')toast(`${e.gateId.at(-1)}번 차단기가 열렸어요.`,1800);};comboShown=market.state.combo?.chain||0;comboUntil=0;$('#combo-banner').classList.remove('show');hideModal();view='game';$('#lobby').hidden=true;$('#game').hidden=false;targets();$('#game-level').textContent=`${run?.practice?'퍼즐 체험':(market.state.levelIndex+1)+'단계'} · ${DISTRICTS[districtFor(market.state.levelIndex)].name}${market.state.levelIndex%10===9?' · 도전':''}`;}
function resume(){if(!market)return;enterGame();if(run.startPending)stageStart();else sfx.play('resume');}
$('#garage-trial').onclick=()=>{showModal('돌발 미션 체험','<p>운행 도중 예상치 못한 손님을 만나 보세요.<br>기존 기록과 코인은 바뀌지 않아요.</p><div class="puzzle-trials"><button id="trial-cut">새치기 손님 · 5단계</button><button id="trial-rescue">응급차 출동 · 11단계</button></div>','닫기',hideModal);$('#trial-cut').onclick=()=>{practiceReturn={market,run,finished};start(4,true);toast('차량을 보내다 보면 새치기 손님이 나타나요.',4500);};$('#trial-rescue').onclick=()=>{practiceReturn={market,run,finished};start(10,true);toast('8대 배차 후 진입로가 열리면 응급차가 들어와요.',5000);};};
$('#play').onclick=()=>requestStart(save.level);$('#continue').onclick=resume;
function targets(){
 $('#car-targets').replaceChildren();for(const car of market.state.cars){const p=carPose(car,market.state),b=document.createElement('button');b.className='car-target';b.dataset.carId=car.id;b.style.cssText=`left:${(p.x-20)/6}%;top:${(p.y-25)/10.8}%;width:7%;height:4%`;b.setAttribute('aria-label',`${car.emergency?"응급차 · ":""}${hiddenCar(car)?'색이 가려진':COLORS[car.color].label} ${vehicleLabel(car,market.state.levelIndex)}${market.state.puzzle?.gates.some(g=>!g.open&&g.keyId===car.id)?' · 열쇠 차량':''}, ${CAPACITY[car.type]}인승, ${canExit(market.state,car)?'이동 가능':'길 막힘'}`);b.onclick=()=>dispatch(car.id);$('#car-targets').append(b);}
 $('#locked-targets').replaceChildren();for(let i=market.state.bays.length;i<7;i++){const b=document.createElement('button');b.className='locked-target';b.style.left=`${(BAY(i).x-30)/6}%`;b.setAttribute('aria-label',`확장권 또는 광고로 승강장 ${i+1}번 칸 열기`);b.onclick=expandOptions;$('#locked-targets').append(b);}$('#ad').disabled=market.state.bays.length>=7;
}
function renderQueue(){const color=market.state.queue[0],signature=`${color}:${market.state.queue.length}`;if(signature===queueSignature)return;queueSignature=signature;$('#queue-summary').textContent=color?`맨 앞 ${COLORS[color].short} ${COLORS[color].label}`:'모두 탑승했어요!';$('#queue-summary').style.setProperty('--cargo-color',color?COLORS[color].hex:'#fff0cc');}
function dispatch(id){if(view!=='game'||adBusy||!$('#modal').hidden)return;checkpointRun();const result=market.dispatch(id);if(!result.ok){sfx.play('blocked');toast(result.reason==='cutin-wait'?'새치기 손님이 자리를 잡고 있어요. 잠시 기다려 주세요.':result.reason==='emergency-wait'?'마지막 배차의 탑승이 끝나면 판정해요. 잠시 기다려 주세요.':result.reason==='reveal-wait'?'앞 차량이 빠져나가면 색이 드러나요. 잠시 기다려 주세요.':result.reason==='incoming'?'새 셔틀이 주차할 때까지 잠시 기다려 주세요.':result.reason==='blocked'?'화살표 앞을 막은 차부터 꺼내주세요.':'승강장이 가득 찼어요. 되돌려서 길을 열어 보세요.');selected={id,until:market.time+1.6,blocker:result.reason==='blocked'?exitBlockers(market.state,market.state.cars.find(c=>c.id===id))[0]:null};if(selected.blocker?.other.barrier)toast(`${selected.blocker.other.id.at(-1)}번 열쇠 차량이 주차장을 나가면 차단기가 열려요.`);return;}haptic();sfx.play('select');if(market.state.emergency?.status==='active'&&market.state.emergency.remaining<=2)sfx.play('warning');targets();}
$('#scene').addEventListener('pointerup',e=>{if(!market)return;const r=$('#scene').getBoundingClientRect(),car=scene.pick((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*1080/r.height);if(car)dispatch(car.id);});
function undo(){if(market.undo()){sfx.stop();sfx.play('undo');run.undos++;finished=false;targets();hideModal();checkpointRun();toast('배차 전으로 돌아왔어요.');}else {sfx.play('notice');toast('주행과 탑승이 끝나면 되돌릴 수 있어요.');}}
$('#undo').onclick=undo;
$('#guide').onclick=()=>{const request=market.garageTransfer();if(request?.ready){sfx.play('hint');toast(`${COLORS[request.car.color].label} 셔틀은 차고에 있어요. 빈 승강장으로 자동 진입합니다.`,4000);return;}const car=market.readySuggestion();if(!car){sfx.play('notice');toast('이동 중인 셔틀을 기다려 주세요.');return;}sfx.play('hint');run.hints++;selected={id:car.id,until:market.time+3};toast(`${hiddenCar(car)?'가려진':COLORS[car.color].label} ${vehicleLabel(car,market.state.levelIndex)}의 길이 열려 있어요.`,3000);};
function pause(){sfx.stop();sfx.play('pause');showModal(`${market.state.levelIndex+1}단계 · 잠시 쉬어가기`,'<p>지금은 운행이 멈춰 있습니다.</p><button class="secondary" id="pause-retry">이 단계 다시 시작</button><button class="secondary" id="pause-home">대기실로 돌아가기</button><button class="secondary" id="pause-settings">설정</button>','계속 운행하기',()=>{hideModal();sfx.play('resume');});$('#pause-retry').onclick=()=>showModal('다시 시작할까요?','<p>이번 단계의 차량과 손님이 처음 위치로 돌아갑니다. 사용한 아이템 효과는 끝나며, 사용한 수량은 반환되지 않아요.</p>','다시 시작',()=>start(market.state.levelIndex,!!run.practice));$('#pause-home').onclick=()=>showLobby('home');$('#pause-settings').onclick=settings;}
$('#settings').onclick=pause;$('#town').onclick=()=>showLobby('home');
async function reward(){
 if(adBusy||market.state.bays.length>=7||market.state.status==='won')return;
 const actual=!!window.PickupRushAds?.showRewarded;
 showModal('승강장 한 칸 더',`<p>완료하면 이번 단계에서 승강장 한 칸을 더 쓸 수 있어요.</p><p class="subtle">${actual?'보상형 광고':'웹 체험판 · 3초 테스트 광고'}<br>승강장을 확장해도 별 차감 없이 시간으로 평가합니다.</p><div class="ad-progress"><div id="ad-progress"></div></div>`,actual?'광고 보기':'테스트 광고 보기',async()=>{
  let outcome='notice';adBusy=true;syncMusic();$('#primary').disabled=true;$('#close').hidden=true;
  try{const r=await platform.requestRewardedAd(p=>$('#ad-progress').style.transform=`scaleX(${p})`);if(r.rewarded&&market.addBay()){outcome='expand';finished=false;targets();checkpointRun();toast(`승강장 ${market.state.bays.length}칸으로 확장했어요.`);}else toast('광고가 완료되지 않아 보상이 지급되지 않았어요.');}catch{toast('광고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');}finally{adBusy=false;syncMusic();$('#close').hidden=false;hideModal();if(market.state.status==='lost')finished=false;sfx.unlock().then(()=>sfx.play(outcome));}
 });
}
$('#ad').onclick=expandOptions;
$('#bag').onclick=openBag;
function finish(){
 finished=true;
 if(market.state.status==='won'){
  if(run.practice){sfx.play('clear');showModal('퍼즐 체험 완료!','<p>손님을 모두 태워 보냈어요.</p><p class="subtle">체험에서는 코인과 완료 기록이 바뀌지 않아요.<br>기존 운행과 기록은 그대로 유지됩니다.</p>','대기실로',()=>showLobby('home'));return;}
  const n=market.state.levelIndex,result=complete(save,n,{...run,bays:market.state.bays.length,passengers:market.total,combo:market.state.combo?.best||0,emergency:market.state.emergency?.status==='success',queueCut:market.state.queueCut?.status==='success'});persist();clearSession();sfx.play('clear');
  showModal(result.all?'모든 골목을 밝혔어요!':'야시장에 도착했어요!',`<div class="result-stars" aria-label="별 ${result.stars}개">${'★'.repeat(result.stars)}${'☆'.repeat(3-result.stars)}</div><p>${market.total}명의 손님과 함께한 ${n+1}번째 정류장</p><div class="result-stats"><span>운행 시간<b>${Math.floor(run.seconds/60)}:${String(Math.floor(run.seconds%60)).padStart(2,'0')}</b></span><span>획득 코인<b>+${result.reward}</b></span></div>${Object.values(run.eventRewards||{}).some(Boolean)?`<p class="mission-paid-note">돌발 미션 +${Object.values(run.eventRewards).reduce((a,b)=>a+b,0)}코인은 운행 중 이미 받았어요.</p>`:''}${result.cutReward?`<p class="growth-result">새치기 손님 탑승 성공 · 보너스 +${result.cutReward}코인</p>`:""}${result.emergencyReward?`<p class="growth-result">긴급 운행 성공 · 보너스 +${result.emergencyReward}코인</p>`:""}<p class="combo-result">최고 ${result.combo}연속 만차${result.comboReward?` · 콤보 보너스 +${result.comboReward}코인`:""}</p>${n%10===9&&result.fresh?`<p class="growth-result">✦ ${marketGrowth(save).regions[Math.floor(n/10)].name} 오픈!<br>대기실 야시장이 더 밝아졌어요.</p>`:""}<p class="subtle">${result.stars===3?'목표 시간 안에 도착했어요!':result.stars===2?'조금 더 빠르게 도착하면 별 3개!':'끝까지 운행을 마쳤어요! 다시 도전해 별을 모아 보세요.'}<br>★★★ ${formatTime(timeTargets(n).three)} 이내 · ★★ ${formatTime(timeTargets(n).two)} 이내</p><button id="result-home" class="secondary">대기실로 돌아가기</button>`,n<TOTAL_LEVELS-1?'다음 단계 출발':'여정 둘러보기',()=>{if(n<TOTAL_LEVELS-1)start(n+1);else showLobby('map');});$('#result-home').onclick=()=>showLobby('home');
 }else{
  sfx.play('lose');showModal('승강장이 모두 찼어요','<p>줄 맨 앞 손님과 같은 색 셔틀이 없어요.<br>되돌려서 필요한 차가 들어올 자리를 만들어 보세요.</p><button id="lost-undo" class="secondary">무료 되돌리기</button><button id="lost-ad" class="secondary">확장권 / 광고로 승강장 +1</button><button id="lost-home" class="secondary">대기실로 돌아가기</button>','무료 다시 도전',()=>start(market.state.levelIndex,!!run.practice));$('#lost-undo').disabled=!market.canUndo;$('#lost-undo').onclick=undo;$('#lost-ad').disabled=market.state.bays.length>=7;$('#lost-ad').onclick=expandOptions;$('#lost-home').onclick=()=>showLobby('home');
 }
}
let lobbyFrame=0;
function frame(now){
 const elapsed=last?Math.max(0,(now-last)/1000):0,dt=Math.min(elapsed,.05);last=now;
 if(view==='game'&&market){
  if($('#modal').hidden&&!document.hidden&&market.state.status==='playing'){market.tick(dt);run.seconds+=elapsed;}renderTimer();
  const board=market.state.cars.map(c=>c.id+':'+!!c.revealed).join(',')+':'+(market.state.puzzle?.gates||[]).map(g=>g.open).join(',');if(board!==boardSignature){boardSignature=board;targets();}renderGarage();renderCombo(now);renderEmergency();renderQueueCut();
  scene.colorAssist=save.colorAssist;scene.reduceMotion=reduced.matches;scene.decoration=save.decoration;const nav=navigationSuggestion(market,run);scene.draw(market,selected?.until>market.time?selected:nav?{id:nav.id,until:market.time+1,navigator:true}:null);renderQueue();renderBagBadge();
  $('#coin-count').textContent=save.coins;$('#hint').textContent=`${market.delivered}/${market.total}명 탑승 · 승강장 ${market.state.bays.length}/7 · ${market.state.moves}번 배차`;
  $('#undo').disabled=!market.canUndo;$('#game').dataset.status=market.state.status;$('#game').dataset.completed=market.delivered;
  const signature=`${market.state.garage?.arrived||0}:${market.state.moves}:${market.delivered}:${market.state.bays.filter(Boolean).length}:${Math.floor(run.seconds/5)}`;
  if(!market.busy&&signature!==checkpointSignature){checkpointRun();checkpointSignature=signature;}
  if(market.state.status!=='playing'&&!finished&&$('#modal').hidden)finish();
 }else if(now-lobbyFrame>65){const art=$('#lobby-art');if(!art.complete||!art.naturalWidth)lobbyScene.draw(now/1000,save.decoration,reduced.matches);lobbyFrame=now;}
 const status=$('#music-status');if(status)status.textContent=music.status==='error'?'음악을 불러오지 못했어요. 연결을 확인해 주세요.':music.status==='playing'?`재생 중 · ${TRACKS[music.current].title}`:!save.music?'배경음악 꺼짐':'화면을 누르면 음악이 재생됩니다.';
 if(now>toastUntil)$('#toast').classList.remove('show');requestAnimationFrame(frame);
}
function syncMusic(){sfx.configure({enabled:save.sound,volume:save.soundVolume,suspended:document.hidden||adBusy});music.configure({enabled:save.music,volume:save.musicVolume,track:save.musicTrack,level:view==='game'?market.state.levelIndex:0,suspended:document.hidden||adBusy,ducked:view==='game'&&!$('#modal').hidden});}
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{syncMusic();sfx.unlock();music.unlock();},{capture:true});
setInterval(syncMusic,500);
function drawGarageMiniatures(root,cars){
 for(const canvas of root.querySelectorAll('canvas[data-mini]')){const car=cars.find(c=>c.id===canvas.dataset.mini);if(!car)continue;const preview=new MarketScene(canvas);canvas.width=180;canvas.height=96;preview.c.setTransform(1.45,0,0,1.45,3,5);preview.levelIndex=market.state.levelIndex;preview.colorAssist=save.colorAssist;preview.vehicle(car,{x:60,y:45,angle:-.13},{arrow:false});}
}
function miniMarkup(car){return `<canvas class="shuttle-mini" width="180" height="96" data-mini="${car.id}" aria-label="${COLORS[car.color].label} ${vehicleLabel(car,market.state.levelIndex)}"></canvas>`;}
function puzzleHelp(kind){showModal(kind==='cover'?'가려진 셔틀을 만났어요':'열쇠로 길을 열어요',kind==='cover'?'<p class="puzzle-intro">? → 색 공개 → 배차</p><p>회색 덮개 아래 색은 정해져 있어요.<br><b>화살표 앞을 막는 차를 빼면</b> 덮개가 벗겨져요.<br>색을 확인한 뒤 필요한 셔틀을 보내세요.</p>':'<p class="puzzle-intro">⚿ → 차단기 개방</p><p><b>열쇠 표시가 있는 차량</b>을 꺼내 주세요.<br>차가 주차장을 완전히 나가면 같은 번호 차단기가 열려요.<br>손님을 다 태울 때까지 기다리지 않아도 돼요.</p>','운행 시작',hideModal);}
function renderGarage(){
 const button=$('#garage-preview');button.hidden=!market.state.garage;if(button.hidden)return;
 const status=garageStatus(market.state,market.arriving),request=market.garageTransfer(),incoming=market.running.find(c=>c.fromGarage&&c.phase==='driving'),signature=JSON.stringify([status,request,incoming?.id,save.colorAssist]);
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
 button.innerHTML=`<b>${options.length?'갈림길 노선 · 먼저 올 셔틀 선택':preferred?`${COLORS[preferred.color].label} 우선 · ${status.text}`:status.text}</b><span>${status.wave?status.wave.cars.slice(0,5).map(miniMarkup).join(''):'✓'} <small>${status.pending}대 남음</small></span>`;
 drawGarageMiniatures(button,status.wave?.cars||[]);
 button.setAttribute('aria-label',`${options.length?'차고 노선 선택. ':''}${status.text}, ${status.pending}대 남음. 다음 차량 보기`);
}
$('#garage-preview').onclick=()=>{
 if(view!=='game'||adBusy||!$('#modal').hidden)return;
 const choices=routeOptions(market.state);if(choices.length){showRouteChoice(choices);return;}
 const s=garageStatus(market.state,market.arriving);showModal('차고 입차 예고',`<p>${s.text}</p><div class="arrival-list">${market.state.garage.waves.map((w,i)=>`<article><b>${i+1}차 · 차고 ${w.gate?'B':'A'}</b><small>${w.trigger}대 배차 후, 진입로가 비면</small><div>${w.cars.map(c=>`<span style="--car-color:${COLORS[c.color].hex}">${miniMarkup(c)}${COLORS[c.color].short} ${COLORS[c.color].label} ${vehicleLabel(c,market.state.levelIndex)}</span>`).join('')||'입차 완료'}</div></article>`).join('')}</div><p class="subtle">맨 앞 손님의 색이 차고에만 남으면<br>빈 승강장으로 자동 진입해요.<br>버튼을 누를 필요 없이 기다리면 됩니다.</p>`,'확인',hideModal);drawGarageMiniatures($('#modal-body'),pendingCars(market.state));
};
document.addEventListener('visibilitychange',syncMusic);
window.addEventListener('resize',()=>{scene.resize();lobbyScene.resize();});document.addEventListener('visibilitychange',()=>{last=0;checkpointRun();});window.addEventListener('pagehide',checkpointRun);
showLobby();syncMusic();if(restored&&market.demandVersion<5)toast('새 색상은 새 운행부터 적용돼요. 기존 판은 그대로 이어져요.',5000);requestAnimationFrame(frame);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=54').catch(()=>{});

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
 button.innerHTML=`<span><b>나의 야시장</b><small>${growth.opened} / 20 가게 오픈 <i>↗</i></small></span><svg viewBox="0 0 340 63" aria-hidden="true">${growth.regions.slice(districtFor(save.level)<10?0:10,districtFor(save.level)<10?10:20).map((r,i)=>stallDrawing(r,i*34)).join('')}</svg>`;
 button.setAttribute('aria-label',`나의 야시장, 가게 ${growth.opened}개 오픈. 성장 현황 보기`);
}
function showGrowth(){
 const g=marketGrowth(save);
 showModal('조금씩 밝아지는 우리 야시장',`<p>지역의 10단계를 모두 마치면 가게가 열려요.<br>새 지역마다 다른 차량을 만날 수 있어요.<br>장식은 무료로 쌓이고 게임 규칙은 그대로예요.</p><div class="growth-grid">${g.regions.map(r=>`<article class="${r.cleared===10?'open':''}"><svg viewBox="0 0 34 63" aria-hidden="true">${stallDrawing(r,2)}</svg><b>${r.name}</b><small>${r.cleared===10?'영업 중 ✦':`${r.index*10+1}–${r.index*10+10}단계 · ${r.cleared}/10 완료`}</small></article>`).join('')}</div>`,'다음 골목으로',()=>{hideModal();district=districtFor(save.level);showLobby('map');});
}
$('#market-growth').onclick=showGrowth;
function showRouteChoice(choices){
 showModal('다음 셔틀, 어느 노선부터?',`<p>길이 열리면 고른 셔틀이 먼저 입차해요.</p><div class="route-choices">${choices.map(c=>`<button data-route-car="${c.id}" style="--route-color:${COLORS[c.color].hex}"><span>${COLORS[c.color].short}</span><b>${COLORS[c.color].label} ${vehicleLabel(c,market.state.levelIndex)}</b><small>${CAPACITY[c.type]}인승 · 우선 입차</small></button>`).join('')}</div><p class="subtle">선택은 무료이고 시간제한도 없어요.<br>선택하지 않으면 원래 순서로 자동 입차합니다.<br>길이 막히면 다른 차량부터, 맨 앞 손님의 색이 차고에만 있으면 해당 차량부터 들어와요.</p>`,'원래 순서로 계속',hideModal);
 document.querySelectorAll('[data-route-car]').forEach(b=>b.onclick=()=>{
  const car=choices.find(c=>String(c.id)===b.dataset.routeCar);
  if(car&&chooseRoute(market.state,car.id)){market.garageCheckKey=null;garageSignature='';checkpointRun();hideModal();renderGarage();sfx.play('hint');toast(`${COLORS[car.color].label} 노선 선택 완료 · 입차는 자동이에요.`);}
 });
}

function emergencyDetails(paid=0){
 const e=market?.state.emergency;if(!e)return;
 const color=COLORS[e.color],car=market.state.bays.find(c=>c?.id===e.id),loaded=car?.loaded||0;
 const active=e.status==='active';
 showModal(active?'긴급 운행 요청!':e.status==='success'?'긴급 운행 성공!':'긴급 운행 시간이 지났어요',
  `<div class="emergency-card" style="--target-color:${color.hex}"><b>🚑 ${color.short} ${color.label} 손님</b><strong>${active?`${loaded} / ${e.capacity}명 · ${e.remaining}번 배차 남음`:e.status==='success'?'전원 탑승 · 출발 완료':'보너스 도전 종료'}</strong></div>${e.status==='success'?missionRewardMarkup('emergency',paid):''}<p>${active?'흰 차체의 응급차에 같은 색 손님을 모두 태워 출발시켜 주세요. 손님은 기존 줄 순서대로 탑승해요.':e.status==='success'?(run.practice?'돌발 미션을 성공했어요! 정규 운행에서는 첫 성공 보너스를 받을 수 있어요.':'보너스 코인은 성공 즉시 지급되며 상점에서 바로 사용할 수 있어요.'):'코인이나 별을 잃지 않아요. 응급차도 일반 셔틀처럼 남은 손님을 태우며 운행을 계속합니다.'}</p><p class="subtle">${active?'차량을 성공적으로 배차할 때만 1턴 차감.<br>기다리기 · 길 막힘 · 자동 입차는 차감되지 않아요.<br>마지막 턴의 탑승과 출발까지 판정해요.':run.practice?'체험에서는 코인과 기록이 바뀌지 않아요.':''}</p>`,active?'긴급 운행 시작':'계속 운행하기',hideModal);
}
function renderEmergency(){
 const e=market.state.emergency,hud=$('#emergency-hud');hud.hidden=!e||cutActive(market.state.queueCut);if(!e||cutActive(market.state.queueCut))return;
 const c=COLORS[e.color],car=market.state.bays.find(car=>car?.id===e.id);
 hud.style.setProperty('--target-color',c.hex);hud.classList.toggle('urgent',e.status==='active'&&e.remaining<=2);
 hud.innerHTML=`<strong>🚑 ${c.short} ${c.label} ${e.status==='success'?e.capacity:car?.loaded||0}/${e.capacity}</strong><span>${e.status==='active'?`${e.remaining}턴 남음`:e.status==='success'?'긴급 운행 성공':'도전 종료'}</span>`;
 hud.setAttribute('aria-label',`긴급 운행 ${c.label}, ${e.status==='active'?e.remaining+'번 배차 남음':e.status==='success'?'성공':'도전 종료'}`);
 if(!$('#modal').hidden||document.hidden)return;
 if(!e.announced&&e.status==='active'&&market.state.status==='playing'){e.announced=true;sfx.play('emergency');emergencyDetails();}
 else if(e.status!=='active'&&(!e.resultSeen||e.status==='success'&&!run.practice&&!save.emergencyWins.includes(market.state.levelIndex))&&!market.busy){const paid=e.status==='success'?awardMission('emergency'):0;if(paid===null)return;e.resultSeen=true;sfx.play(e.status==='success'?'success':'timeout');emergencyDetails(paid);checkpointRun();}
}
$('#emergency-hud').onclick=()=>emergencyDetails();

function puzzleTrials(){
 showModal('새로운 길을 미리 만나세요',`<p>기록이나 진행 단계를 바꾸지 않는 무료 체험이에요.</p><div class="puzzle-trials"><button data-puzzle-trial="4">5단계 · 새치기 돌발 미션</button><button data-puzzle-trial="20">21단계 · 가려진 셔틀</button><button data-puzzle-trial="40">41단계 · 열쇠와 차단기</button><button data-puzzle-trial="70">71단계 · 장치 조합</button></div>`,'닫기',hideModal);
 document.querySelectorAll('[data-puzzle-trial]').forEach(b=>b.onclick=()=>{if(!run?.practice)practiceReturn={market,run,finished};start(Number(b.dataset.puzzleTrial),true);if(b.dataset.puzzleTrial==='4')toast('4대 배차 뒤, 다른 색 손님이 새치기할 기회를 노려요.',5000);});
}

function queueCutDetails(paid=0){
 const q=market?.state.queueCut;if(!q)return;
 const c=COLORS[q.color],active=cutActive(q);
 showModal(active?'앗, 새치기 손님 등장!':q.status==='success'?'새치기 손님 탑승 완료!':'다시 줄을 서 주세요!',
  `<div class="cut-card" style="--guest-color:${c.hex}"><div class="cut-guests" aria-hidden="true">${q.ids.map(()=>'<i><b>!</b></i>').join('')}</div><strong>${c.short} ${c.label} 손님 ${q.ids.length}명</strong><span>${active?`${q.remaining}번 배차 안에 태워 주세요`:q.status==='success'?'돌발 미션 성공':'손님들이 원래 줄로 돌아갔어요'}</span></div>${q.status==='success'?missionRewardMarkup('queueCut',paid):''}<p>${active?'뒤에 있던 손님들이 맨 앞으로 끼어들었어요!<br>같은 색 셔틀을 보내 먼저 태워 주세요.':q.status==='success'?(run.practice?'돌발 미션을 성공했어요! 정규 운행에서는 첫 성공 보너스를 받을 수 있어요.':'보너스 코인은 성공 즉시 지급되며 상점에서 바로 사용할 수 있어요.'):'코인이나 별을 잃지 않아요.<br>원래 운행을 이어 가면 됩니다.'}</p><p class="subtle">${active?'성공한 배차만 차감 · 기다리기와 막힌 차 클릭은 무료<br>마지막 배차의 탑승이 끝날 때 판정해요.':run.practice?'체험에서는 코인과 기록이 바뀌지 않아요.':''}</p>`,active?'어디 한번 태워볼까!':'계속 운행하기',hideModal);
}
function renderQueueCut(){
 const q=market.state.queueCut,hud=$('#cut-hud'),e=market.state.emergency;
 hud.hidden=!q||(!cutActive(q)&&!!e);if(!q)return;
 const c=COLORS[q.color],signature=`${q.color}:${q.status}:${q.remaining}:${q.boarded.length}`;
 if(hud.dataset.mission!==signature){hud.dataset.mission=signature;hud.style.setProperty('--guest-color',c.hex);
 hud.classList.toggle('urgent',q.status==='active'&&q.remaining<=1);
 const label=cutActive(q)?`${q.remaining}번 남음`:q.status==='success'?'탑승 성공':'줄 복귀';
 hud.innerHTML=`<strong>! ${c.short} ${c.label} ${q.boarded.length}/${q.ids.length}</strong><span>${label}</span>`;
 hud.setAttribute('aria-label',`새치기 미션 ${c.label} 손님 ${q.boarded.length}/${q.ids.length}명 탑승, ${label}`);}
 if(!$('#modal').hidden||document.hidden)return;
 if(!q.announced&&cutActive(q)&&market.state.status==='playing'){q.announced=true;sfx.play('cutin');queueCutDetails();}
 else if(!cutActive(q)&&(!q.resultSeen||q.status==='success'&&!run.practice&&!save.cutWins.includes(market.state.levelIndex))&&!market.busy){const paid=q.status==='success'?awardMission('queueCut'):0;if(paid===null)return;q.resultSeen=true;queueCutDetails(paid);checkpointRun();}
}
$('#cut-hud').onclick=()=>queueCutDetails();

// Consumables share one durable save with the exact checkpoint they affect.
function commitItems(next){localStorage.setItem(SAVE,JSON.stringify(next));}
const itemMessages={'shuffle-unavailable':'지금은 안전하게 섞을 차량이 부족해요. 아이템은 사용되지 않았어요.',coins:'코인이 부족해요. 운행과 미션으로 모아 보세요.',limit:'아이템은 종류별로 최대 99개까지 보관할 수 있어요.',storage:'저장하지 못해 거래를 취소했어요. 코인과 아이템은 그대로예요.',practice:'무료 체험에서는 보유 아이템을 사용하지 않아요.',busy:'셔틀 주행과 탑승이 끝난 뒤 가방을 열어 주세요.',max:'승강장은 최대 7칸이에요.',active:'이번 운행에 이미 적용 중이에요.',lost:'승강장 확장이나 되돌리기로 운행을 재개해 주세요.',empty:'보유 아이템이 없어요.',ended:'완료한 운행에는 사용할 수 없어요.',start:'운행을 시작한 뒤 사용해 주세요.'};
function itemError(reason){sfx.play('notice');toast(itemMessages[reason]||'지금은 사용할 수 없어요.');}
function itemMarkup(item,action,label,disabled=false){return `<article class="supply-card" style="--item-color:${item.color}"><div class="supply-icon" aria-hidden="true">${item.icon}</div><div class="supply-copy"><h2>${item.name}</h2><p>${item.description}</p><small>${item.detail}</small></div><div class="supply-bottom"><span>보유 <b>${save.inventory[item.id]}</b>개</span><button ${action} ${disabled?'disabled':''}>${label}</button></div></article>`;}
function renderShop(body){
 body.innerHTML=`<div class="balance-card"><small>운행으로 모은 코인</small><strong>● ${save.coins}</strong><span>첫 완료 40 + 새 별마다 10 코인</span></div><h2 class="supply-title">운행 필수품 <small>구매 후 가방에 보관</small></h2><div class="supply-list">${ITEMS.map(i=>itemMarkup(i,`data-buy-item="${i.id}"`,`● ${i.price} · 구매`,save.inventory[i.id]>=99)).join('')}</div><article class="supply-card supply-bundle"><div class="supply-icon" aria-hidden="true">▣</div><div class="supply-copy"><h2>${BUNDLE.name}</h2><p>확장권 + 자동 길잡이 + 미리보기<br>각 1개씩, 필요한 순간에 꺼내 쓰세요.</p><small>따로 살 때보다 ${ITEMS.filter(i=>BUNDLE.contents[i.id]).reduce((sum,i)=>sum+i.price*BUNDLE.contents[i.id],0)-BUNDLE.price}코인 절약</small></div><div class="supply-bottom"><span>아이템 3개</span><button data-buy-item="starter" ${ITEMS.some(i=>BUNDLE.contents[i.id]&&save.inventory[i.id]>=99)?'disabled':''}><span class="bundle-was">${ITEMS.filter(i=>BUNDLE.contents[i.id]).reduce((sum,i)=>sum+i.price*BUNDLE.contents[i.id],0)}</span>● ${BUNDLE.price}</button></div></article><p class="shop-note">게임 중 아래쪽 ‘아이템’ 버튼에서 사용해요.<br>무료 되돌리기와 길 찾기는 계속 이용할 수 있어요.<br>실제 결제 없이 게임 코인으로만 구매합니다.</p><details class="shop-themes"><summary>등불 꾸미기 · 기존 보유 상품</summary><div class="theme-list">${THEMES.map(t=>`<button class="theme-card" data-theme="${t.id}" style="--theme:${t.color}"><span class="theme-art">🏮</span><span><strong>${t.name}</strong><small>${t.description}</small></span><b>${save.decoration===t.id?'사용 중':save.owned.includes(t.id)?'적용':`● ${t.price}`}</b></button>`).join('')}</div></details>`;
 body.querySelectorAll('[data-buy-item]').forEach(b=>b.onclick=()=>confirmPurchase(b.dataset.buyItem,()=>{home();renderPanel();}));
 body.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{const t=THEMES.find(t=>t.id===b.dataset.theme);if(save.owned.includes(t.id)){buyTheme(save,t.id);persist();home();renderPanel();beep();return;}if(save.coins<t.price){itemError('coins');return;}showModal(t.name,`<p>${t.price}코인으로 등불을 구매할까요?</p>`,'구매하고 적용',()=>{buyTheme(save,t.id);persist();hideModal();home();renderPanel();sfx.play('reward');});});
}
function confirmPurchase(id,done){
 const item=ITEMS.find(i=>i.id===id)||BUNDLE;
 if(save.coins<item.price){itemError('coins');return;}
 showModal(item.name,`<div class="supply-confirm"><span class="supply-icon" style="--item-color:${item.color||'#ffe0a0'}" aria-hidden="true">${item.icon||'▣'}</span></div><p><b>${item.price}코인</b>으로 구매해 가방에 넣을까요?</p><p class="subtle">보유 ${save.coins} → 구매 후 ${save.coins-item.price}코인<br>구매만으로 사용되지 않아요.</p>`,`${item.price}코인으로 구매`,()=>{const result=purchase(save,id,commitItems);if(!result.ok){itemError(result.reason);return;}hideModal();sfx.play('reward');done();toast('가방에 담았어요. 필요한 순간에 사용하세요.');});
}
function renderBagBadge(){const count=Object.values(save.inventory).reduce((a,b)=>a+b,0),active=Object.values(run?.tools||{}).some(Boolean);$('#bag-count').textContent=active?'ON':count;$('#bag').classList.toggle('active',active);$('#bag').setAttribute('aria-label',`아이템 가방, ${count}개${active?', 효과 적용 중':''}`);$('#ad small').textContent=save.inventory.bay?`보유 ${save.inventory.bay}`:'AD';}
function openBag(){
 if(!market||adBusy)return;if(market.busy){itemError('busy');return;}
 showModal('내 운행 가방',`<p class="subtle">${run.practice?'무료 체험 · 보유 아이템은 사용하지 않아요.':'필요한 순간에 한 개씩 사용해요. 미사용 아이템은 다음 판에도 남아요.'}</p><div class="bag-list">${ITEMS.map(i=>{const reason=itemAvailability(market,run,i.id),active=reason==='active';return itemMarkup(i,`data-use-item="${i.id}"`,active?(i.id==='manifest'?'전체 줄 보기':'적용 중'):reason?({practice:'체험 중',max:'최대 7칸',lost:'운행 재개 후',busy:'이동 중',ended:'운행 종료'}[reason]||'사용 불가'):save.inventory[i.id]?'1개 사용':`● ${i.price} 구매`,!!reason&&!(active&&i.id==='manifest'));}).join('')}</div><p class="subtle">적용한 효과는 이번 운행에서만 유지돼요.<br>다시 시작하면 효과가 끝납니다.</p>`,'계속 운행',()=>{hideModal();if(market.state.status==='lost')finished=false;});
 document.querySelectorAll('[data-use-item]').forEach(b=>b.onclick=()=>{const id=b.dataset.useItem;if(id==='manifest'&&run.tools?.manifest){showManifest();return;}if(!save.inventory[id]){confirmPurchase(id,openBag);return;}activateItem(id);});
}
function activateItem(id){
 const result=useItem(save,market,run,id,commitItems);if(!result.ok){itemError(result.reason);return;}
 finished=false;selected=null;targets();hideModal();sfx.play(id==='bay'?'expand':id==='shuffle'?'undo':'hint');renderBagBadge();
 if(id==='shuffle'){toast(`차량 ${result.moved}대의 자리를 섞었어요!`,3000);return;}
 if(id==='manifest')showManifest();else toast(id==='bay'?`확장권 사용 · 승강장 ${market.state.bays.length}칸!`:'자동 길잡이 ON · 추천 셔틀을 계속 표시해요.',3500);
}
function showManifest(){
 let position=0;showModal('손님 전체 순서',`<p class="subtle">맨 앞 → 뒤쪽 순서 · 총 ${market.state.queue.length}명<br>같은 색이 이어지는 구간끼리 묶었어요.<br>새치기가 발생하면 현재 순서로 다시 보여요.</p><div class="queue-manifest">${queueGroups(market.state.queue).map(g=>{const from=position+1;position+=g.count;return `<span><i style="--passenger-color:${COLORS[g.color].hex}" aria-hidden="true">${COLORS[g.color].short}</i><b>${COLORS[g.color].label} ${g.count}명</b><small>${from}–${position}번째</small></span>`;}).join('')}</div><p class="subtle">이번 운행에서는 가방에서 무료로 다시 열 수 있어요.</p>`,'확인',hideModal);
}
function expandOptions(){
 if(!market||adBusy)return;if(run.practice){reward();return;}
 const reason=itemAvailability(market,run,'bay');if(reason){itemError(reason);return;}
 showModal('승강장 한 칸 더',`<p>이번 운행의 승강장을 ${market.state.bays.length+1}칸으로 늘려요.</p><p class="subtle">확장권 보유 ${save.inventory.bay}개 · 최대 7칸<br>확장해도 별 차감 없이 시간으로 평가해요.</p><button id="expand-ad" class="secondary">${window.PickupRushAds?.showRewarded?'광고 보고 열기':'무료 테스트 광고로 열기'}</button>`,save.inventory.bay?'확장권 1개 사용':`확장권 구매 · ${ITEMS.find(i=>i.id==='bay').price}코인`,()=>{if(save.inventory.bay)activateItem('bay');else confirmPurchase('bay',expandOptions);});$('#expand-ad').onclick=reward;
}

function stageStart(){
 const n=market.state.levelIndex+1,d=DISTRICTS[districtFor(n-1)],challenge=n%10===0;
 showModal(`${n}단계 출발 준비`, `<div class="stage-intro"><div class="stage-ticket"><small>${run.practice?'FREE PRACTICE':'NEXT DEPARTURE'}</small><div class="stage-number">${n}<span>단계</span></div><strong>${d.icon} ${d.name}</strong><p>${d.subtitle}</p>${challenge?'<span class="stage-challenge">✦ 10단계마다 찾아오는 도전 운행</span>':n>1&&n%10===1?'<span class="stage-challenge">새로운 지역에 도착했어요!</span>':''}</div><div class="stage-facts"><span><b>${market.allCars.length}대</b>셔틀</span><span><b>${new Set(market.allCars.map(c=>c.color)).size}색</b>손님</span><span><b>${market.state.bays.length}칸</b>승강장</span></div></div><p class="subtle">★★★ ${formatTime(timeTargets(n-1).three)} 이내 · ★★ ${formatTime(timeTargets(n-1).two)} 이내<br>${run.practice?'무료 체험 · 코인과 완료 기록은 바뀌지 않아요.':'시간을 넘겨도 계속 도전! 아이템 사용 시 별 차감 없음.'}</p>`,`${n}단계 출발!`,()=>{
  run.startPending=false;hideModal();checkpointRun();sfx.play('start');
  if(market.state.puzzle?.tutorial)puzzleHelp(market.state.puzzle.tutorial);
  else if(!save.tutorial)help(()=>{save.tutorial=true;persist();hideModal();});
 });
 $('#modal').dataset.stageStart='true';$('#close').setAttribute('aria-label','대기실로 돌아가기');
}
function missionRewardMarkup(kind,paid=0){
 const offer=EVENT_REWARDS[kind];
 if(run.practice)return '<p class="mission-paid-note">무료 체험 성공! 실제 코인은 지급되지 않아요.</p>';
 if(paid>0)return `<div class="mission-payout" role="status"><span>돌발 미션 보너스 획득!</span><strong>● +${paid}</strong><span>보유 코인 ${save.coins} · 즉시 지급 완료</span><small>상점 아이템 구매에 바로 사용할 수 있어요.</small></div>`;
 if(run.eventRewards?.[kind])return `<p class="mission-paid-note">이번 운행에서 +${offer.amount}코인을 받았어요.</p>`;
 return `<p class="mission-paid-note">${save[offer.ledger]?.includes(market.state.levelIndex)?'이 단계의 첫 성공 보상은 이미 받았어요.':'성공 보상 확인 중 · 주행이 끝나면 지급해요.'}</p>`;
}
function awardMission(kind){
 const result=claimEventReward(save,market,run,kind,commitItems);
 if(!result.ok){
  if(result.reason==='storage'){showModal('보상을 저장하지 못했어요','<p>성공 보상은 아직 지급되지 않았어요.<br>저장 공간을 확인한 뒤 다시 시도해 주세요.</p><button class="secondary" id="reward-later">대기실에서 나중에 받기</button>','다시 시도',hideModal);$('#reward-later').onclick=()=>showLobby('home');}
  return null;
 }
 if(result.amount){$('#coin-count').textContent=save.coins;$('#lobby-coins').textContent=save.coins;sfx.play('reward');const wallet=$('#game .coins');if(wallet.animate&&!reduced.matches)wallet.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:240,easing:'cubic-bezier(0.23,1,0.32,1)'});}
 return result.amount;
}

function renderTimer(){
 const t=timerState(run.seconds,market.state.levelIndex),label=t.stars>1?`★${t.stars} 남은 시간 ${formatTime(t.remaining)}`:`★1 도전 중 ${formatTime(t.elapsed)}`;
 const el=$('#run-clock');if(el.textContent!==label){el.textContent=label;el.dataset.stars=t.stars;}
}
$('#run-clock').onclick=()=>{const t=timeTargets(market.state.levelIndex);showModal('이번 단계의 별 목표',`<p>진행 시간 <b>${formatTime(run.seconds)}</b></p><p>★★★ ${formatTime(t.three)} 이내<br>★★ ${formatTime(t.two)} 이내<br>★ 이후 완료</p><p class="subtle">아이템을 써도 별이 깎이지 않아요.<br>안내·일시정지·광고 중에는 시간이 멈춰요.</p>`,'계속 운행',hideModal);};
