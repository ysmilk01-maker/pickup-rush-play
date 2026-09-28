// v62 검증 0단계: 파일 참조 무결성 점검 (브라우저·엔진 실행 없이)
// ① sw.js 캐시 목록의 파일이 모두 존재하는가 ② 모든 import·script·link의 ?v= 값이 기대 버전과 같은가
// ③ import·HTML에서 참조한 로컬 파일이 모두 존재하는가 ④ 서비스워커가 캐시하지 않는 JS 모듈이 있는가
// 사용법: node tools/verify/static-check.mjs [기대버전=62]
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {join,dirname,normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const expected=process.argv[2]||'62';
const issues=[],info=[];
const read=f=>readFileSync(join(root,f),'utf8');
const strip=p=>normalize(p.replace(/^\.\//,'').split('?')[0].split('#')[0]);

// ① sw.js
const sw=read('sw.js');
const assets=JSON.parse(sw.match(/const ASSETS = (\[[^\]]*\])/)[1]);
const cacheName=sw.match(/const CACHE = "([^"]+)"/)[1];
info.push(`sw.js 캐시 이름: ${cacheName}, 캐시 대상 ${assets.length}개`);
for(const a of assets){if(!existsSync(join(root,strip(a))))issues.push(`sw.js 캐시 대상 파일 없음: ${a}`);}
if(!cacheName.includes(`v${expected}`))issues.push(`sw.js 캐시 이름에 v${expected} 없음: ${cacheName}`);

// ②③ 참조 스캔
const files=readdirSync(root).filter(f=>/\.(js|html|css)$/.test(f)&&!f.startsWith('campaign-layouts'));
const versions=new Map();let refCount=0;
for(const f of files){
  const text=read(f);
  const refs=[...text.matchAll(/(?:from\s+|import\(\s*|src=|href=|register\()\s*['"](\.\/[^'"]+)['"]/g)].map(m=>m[1]);
  for(const r of refs){
    refCount++;
    const v=r.match(/\?v=(\d+)/)?.[1];
    if(v){versions.set(v,(versions.get(v)||0)+1);if(v!==expected)issues.push(`${f}: 버전 불일치 ${r}`);}
    else if(/\.(js|css)$/.test(strip(r)))issues.push(`${f}: 버전 쿼리 없는 참조 ${r} (캐시 갱신 누락 위험)`);
    if(!existsSync(join(root,strip(r))))issues.push(`${f}: 참조 파일 없음 ${r}`);
  }
}
info.push(`로컬 참조 ${refCount}건 스캔, ?v= 분포 ${JSON.stringify(Object.fromEntries(versions))}`);

// ④ 캐시 누락 모듈
const cached=new Set(assets.map(strip));
const jsFiles=readdirSync(root).filter(f=>f.endsWith('.js')&&f!=='sw.js');
const notCached=jsFiles.filter(f=>!cached.has(f));
if(notCached.length)issues.push(`sw.js 캐시에 없는 JS 파일(오프라인 실행 시 실패 가능): ${notCached.join(', ')}`);

console.log(JSON.stringify({expected,ok:!issues.length,issues,info},null,1));
process.exitCode=issues.length?1:0;
