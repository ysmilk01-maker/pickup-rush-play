// Track launched stages so lobby navigation and reload cannot bypass retry ads.
export function attemptedStages(raw={},max=199){
 const values=[...(Array.isArray(raw.attempted)?raw.attempted:[]),...(Array.isArray(raw.cleared)?raw.cleared:[])];
 if(raw.activeSession?.run?.startPending!==true)values.push(raw.activeSession?.level);
 return [...new Set(values.filter(n=>Number.isInteger(n)&&n>=0&&n<=max))].sort((a,b)=>a-b);
}
export function requiresRetryAd(save,index,practice,market,run){
 if(practice)return !!(run?.practice&&market?.state.levelIndex===index&&!run.startPending);
 return (save.attempted||[]).includes(index)||(save.cleared||[]).includes(index)||!!(!run?.practice&&market?.state.levelIndex===index&&!run?.startPending);
}
export async function retryAfterAd(requestAd,restart,onProgress){
 try{const result=await requestAd(onProgress,'retry-stage');if(result?.rewarded!==true)return {ok:false,reason:'incomplete'};}
 catch{return {ok:false,reason:'unavailable'};}
 restart();return {ok:true};
}
