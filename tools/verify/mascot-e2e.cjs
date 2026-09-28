// v61 UI integration. State fixtures exercise result modals; full gameplay is tested separately.
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'verify-output/mascot');fs.mkdirSync(out,{recursive:true});
const hook=`\nwindow.__mascotQA={result(status,seconds=10){market=new Market(0);run={seconds,hints:0,undos:0,practice:false};market.state.status=status;enterGame();finish();},guide(){help();}};`;
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://x').pathname);
 if(name==='/favicon.ico'){res.writeHead(204);res.end();return;}
 const file=path.join(root,name==='/'?'index.html':name);
 fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);res.end();return;}if(path.basename(file)==='app.js')b=Buffer.from(b.toString()+hook);
 res.writeHead(200,{'content-type':({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});res.end(b);});
});
const results=[];
const check=(name,ok)=>{results.push({name,ok:!!ok});assert.ok(ok,name);};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ko-KR',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  if(localStorage.getItem('night-bite-market-v1'))return;
  const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  const key=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  localStorage.setItem('night-bite-market-v1',JSON.stringify({version:3,coins:1234,tutorial:true,cleared:Array.from({length:10},(_,i)=>i),unlocked:10,level:10,stars:{0:3},threeStarRuns:50,comboBest:{0:7},streak:{last:key,count:6,claimed:true,stamps:[1,2,3,4,5,6]}}));
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const screenshot=name=>page.screenshot({path:path.join(out,name+'.png')});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('night-bite-market-v1')));
 const noOverflow=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('.mascot-message,.stamp-grid,.sticker-grid')].filter(e=>e.getClientRects().length).every(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth+1;}));
 await page.goto(base);await page.waitForSelector('#loading',{state:'hidden',timeout:20000});await screenshot('01-lobby');
 check('legacy stickers restored without coin change',(await saved()).coins===1234&&(await saved()).stickers.length===3);
 await page.locator('#missions').click();check('seven stamps shown',await page.locator('.stamp-cell').count()===7);
 check('six prior claims shown',await page.locator('.stamp-cell.stamped').count()===6);
 await page.locator('[data-streak]').click();await page.waitForTimeout(600);
 check('day seven pays exactly 80',(await saved()).coins===1314);
 check('limited sticker saved',(await saved()).stickers.includes('attendance-7'));
 check('all seven stamps claimed',await page.locator('.stamp-cell.stamped').count()===7);
 check('claim button prevents duplicates',await page.locator('[data-streak]').isDisabled());
 check('mission fits narrow screen',await noOverflow());await page.waitForTimeout(2500);await screenshot('02-stamps');
 await page.reload();await page.waitForSelector('#loading',{state:'hidden',timeout:20000});
 await page.locator('#missions').click();check('reload cannot grant twice',await page.locator('[data-streak]').isDisabled()&&(await saved()).coins===1314);
 await page.locator('#close').click();await page.locator('[data-tab="records"]').click();
 await page.locator('.sticker-grid').scrollIntoViewIfNeeded();await page.locator('#lobby-panel').evaluate(e=>e.scrollTop=500);await screenshot('03-collection');
 check('collection includes 25 entries',await page.locator('.sticker-card').count()===25);
 check('locked and owned cards distinguishable',await page.locator('.sticker-card.owned').count()===4&&await page.locator('.sticker-card.locked').count()===21);
 check('records fit narrow screen',await noOverflow());
 await page.evaluate(()=>window.__mascotQA.result('won',10));await screenshot('04-success-happy');
 check('three stars use happy mascot',await page.locator('.chorong[data-mood="happy"]').count()===1);
 await page.evaluate(()=>window.__mascotQA.result('won',9999));await screenshot('05-success-cheer');
 check('one star uses encouraging mascot',await page.locator('.chorong[data-mood="cheer"]').count()===1);
 await page.evaluate(()=>window.__mascotQA.result('lost'));await screenshot('06-failure');
 check('failure offers comfort and recovery',await page.locator('.chorong[data-mood="comfort"]').count()===1&&await page.locator('#lost-ad').isVisible());
 await page.evaluate(()=>window.__mascotQA.guide());await screenshot('07-tutorial');
 check('tutorial mascot visible',await page.locator('.chorong[data-mood="default"]').count()===1);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#close').click();
 await page.evaluate(()=>{document.querySelector('#town').click();});await page.locator('#missions').click();
 check('reduced motion disables stamp animations',await page.locator('.stamp-cell.today>span').evaluate(e=>getComputedStyle(e).animationName)==='none');
 check('no JavaScript errors',errors.length===0);
 console.log(JSON.stringify({passed:results.filter(r=>r.ok).length,total:results.length,results,errors}));
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'mascot-e2e.json'),JSON.stringify({results},null,2));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
