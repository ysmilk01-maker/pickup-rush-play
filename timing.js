import {STAGE_TIMES} from './stage-times.js?v=57';
export const timeTargets=index=>{const three=STAGE_TIMES[Math.max(0,Math.min(STAGE_TIMES.length-1,Math.trunc(index)||0))];return {three,two:Math.ceil(three*1.5)};};
export function timeStars(seconds,index=0){const t=timeTargets(index),s=Number.isFinite(seconds)?Math.max(0,seconds):0;return s<=t.three?3:s<=t.two?2:1;}
export function formatTime(seconds){const n=Math.max(0,Math.ceil(seconds));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
export function timerState(seconds,index){const stars=timeStars(seconds,index),t=timeTargets(index);return {stars,remaining:stars===3?t.three-seconds:stars===2?t.two-seconds:0,elapsed:seconds};}
