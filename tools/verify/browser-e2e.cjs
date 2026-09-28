// v59 검증 2단계: 실제 브라우저(Chromium, 모바일 화면)에서 게임을 실행해 확인한다.
// 점검: 로딩 완료·콘솔 오류·요청 실패 / 대기실 → 1단계 진입 / 1단계 클릭 플레이로 클리어 /
//       새로고침 이어하기 / 서비스워커 오프라인 재실행 / privacy.html·studio.html 로드
// 사용법: node tools/verify/browser-e2e.cjs [출력폴더=verify-output]
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),'/opt/node22/lib/node_modules']}));
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..','..'),out=path.resolve(process.argv[2]||'verify-output');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  const f=p.endsWith(path.sep)?path.join(p,'index.html'):p;
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(b);});});
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});console.error(`${ok?'PASS':'FAIL'} ${name}${detail?' — '+detail:''}`);};

(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ko-KR'});
  const page=await ctx.newPage();
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});
  page.on('requestfailed',r=>failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  const shot=n=>page.screenshot({path:path.join(out,n)});
  const closeModals=async()=>{for(let i=0;i<5;i++){if(await page.locator('#modal').isHidden())return;await page.locator('#primary').click();await page.waitForTimeout(300);}};

  // 1) 로딩
  const t0=Date.now();
  await page.goto(base);
  await page.waitForSelector('#loading',{state:'hidden',timeout:20000}).catch(()=>{});
  const loadMs=Date.now()-t0;
  check('로딩 화면 종료 후 대기실 표시',await page.locator('#lobby').isVisible(),`${loadMs}ms`);
  await page.waitForTimeout(800);await shot('01-lobby.png');
  check('대기실 코인 표시',await page.locator('#lobby-coins').isVisible());
  await closeModals();

  // 2) 1단계 진입
  await page.locator('#play').click();
  await page.waitForTimeout(600);await closeModals();
  const inGame=await page.locator('#game').isVisible();
  check('출발 버튼 → 게임 화면 진입',inGame,await page.locator('#game-level').textContent().catch(()=>''));
  await page.waitForTimeout(1500);await shot('02-stage1-start.png');

  // 3) 1단계 클릭 플레이: 맨 앞 손님 색과 같은 '이동 가능' 차량 우선, 없으면 이동 가능한 아무 차량
  let clicks=0,won=false,lost=false;
  for(let step=0;step<400&&!won&&!lost;step++){
    if(await page.locator('#modal').isVisible()){
      const title=(await page.locator('#modal-title').textContent())||'';
      if(/도착|밝혔/.test(title)){won=true;break;}
      if(/막혔|실패|가득/.test(title)){lost=true;break;}
      await page.locator('#primary').click().catch(()=>{});await page.waitForTimeout(300);continue;
    }
    const front=((await page.locator('#queue-summary').textContent())||'').replace(/^맨 앞 \S+ /,'').trim();
    const labels=await page.$$eval('#car-targets .car-target',bs=>bs.map(b=>({id:b.dataset.carId,label:b.getAttribute('aria-label')})));
    const movable=labels.filter(l=>l.label.includes('이동 가능')&&!l.label.includes('가려진'));
    const pick=movable.find(l=>front&&l.label.includes(front))||movable[0];
    if(!pick){await page.waitForTimeout(400);continue;}
    await page.locator(`#car-targets .car-target[data-car-id="${pick.id}"]`).dispatchEvent('click');clicks++;
    if(clicks===8)await shot('03-stage1-mid.png');
    await page.waitForTimeout(1300);
  }
  await page.waitForTimeout(800);await shot('04-stage1-result.png');
  check('1단계 클릭 플레이로 클리어',won,`클릭 ${clicks}회${lost?' (패배 모달)':''} · ${await page.locator('#modal-title').textContent().catch(()=>'')}`);
  const saved=await page.evaluate(()=>Object.keys(localStorage).map(k=>[k,(localStorage.getItem(k)||'').length]));
  check('진행 데이터 localStorage 저장',saved.length>0,JSON.stringify(saved));

  // 4) 새로고침 후 진행 유지
  await page.reload();await page.waitForSelector('#loading',{state:'hidden',timeout:20000}).catch(()=>{});await page.waitForTimeout(800);await closeModals();
  const cleared=(await page.locator('#home-cleared').textContent().catch(()=>''))||'';
  check('새로고침 후 완료 기록 유지',cleared.trim()==='1',`home-cleared="${cleared.trim()}"`);
  await shot('05-lobby-after-reload.png');

  // 5) 서비스워커 오프라인 재실행
  const swReady=await page.evaluate(async()=>{if(!('serviceWorker' in navigator))return 'unsupported';const r=await Promise.race([navigator.serviceWorker.ready.then(()=>'ready'),new Promise(r=>setTimeout(()=>r('timeout'),8000))]);return r;});
  await page.waitForTimeout(1500);
  const cacheInfo=await page.evaluate(async()=>{const keys=await caches.keys();const n=keys.length?(await (await caches.open(keys[0])).keys()).length:0;return {keys,n};});
  check('서비스워커 활성화 및 캐시 생성',swReady==='ready'&&cacheInfo.n>0,`${swReady} · ${JSON.stringify(cacheInfo)}`);
  await ctx.setOffline(true);
  const offErrors=errors.length;
  await page.reload().catch(e=>errors.push('offline reload: '+e.message));
  await page.waitForSelector('#loading',{state:'hidden',timeout:20000}).catch(()=>{});
  check('오프라인 상태에서 재실행',await page.locator('#lobby').isVisible(),`오프라인 중 새 오류 ${errors.length-offErrors}건`);
  await shot('06-offline.png');
  await ctx.setOffline(false);

  // 6) 부가 페이지
  for(const p of ['privacy.html','studio.html']){
    const pg=await ctx.newPage();const pe=[];pg.on('pageerror',e=>pe.push(e.message));
    const r=await pg.goto(base+p);await pg.waitForTimeout(1200);
    check(`${p} 로드`,r?.ok()&&!pe.length,`status ${r?.status()} · 오류 ${pe.length}건 ${pe.join(' | ')}`);
    await pg.screenshot({path:path.join(out,`07-${p.replace('.html','')}.png`),fullPage:false});await pg.close();
  }

  check('콘솔/페이지 오류 없음',!errors.length,errors.slice(0,10).join(' | '));
  const realFailed=failed.filter(f=>!/net::ERR_INTERNET_DISCONNECTED|ERR_ABORTED/.test(f));
  check('요청 실패 없음(오프라인 구간 제외)',!realFailed.length,realFailed.slice(0,10).join(' | '));
  await browser.close();server.close();
  const summary={version:'v59',passed:results.filter(r=>r.ok).length,total:results.length,results,loadMs};
  fs.writeFileSync(path.join(out,'browser-e2e.json'),JSON.stringify(summary,null,1));
  console.log(JSON.stringify(summary));
  process.exitCode=summary.passed===summary.total?0:1;
})().catch(e=>{console.error(e);server.close();process.exit(2);});
