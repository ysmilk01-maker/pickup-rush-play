import {checkpoint} from './session.js?v=52';

export const EVENT_REWARDS={
 emergency:{amount:20,ledger:'emergencyWins',minimum:10},
 queueCut:{amount:15,ledger:'cutWins',minimum:4}
};
// Keep the first-success ledger outside undoable game state. A reward is
// spendable even when the player later loses or restarts this stage.
export function claimEventReward(save,m,run,kind,commit=()=>{}){
 const offer=EVENT_REWARDS[kind],event=m?.state[kind],level=m?.state.levelIndex;
 if(!offer||!run||event?.status!=='success'||!Number.isInteger(level)||level<offer.minimum||level>save.unlocked)return {ok:false,reason:'ineligible',amount:0};
 if(run.practice)return {ok:true,reason:'practice',amount:0};
 const ledger=save[offer.ledger]||[];
 if(ledger.includes(level))return {ok:true,reason:'claimed',amount:0};
 const nextRun={...run,eventRewards:{...run.eventRewards,[kind]:offer.amount}};
 const next={...save,coins:save.coins+offer.amount,[offer.ledger]:[...ledger,level],activeSession:checkpoint(m,nextRun)||save.activeSession};
 try{commit(next);}catch{return {ok:false,reason:'storage',amount:0};}
 Object.assign(save,next);Object.assign(run,nextRun);
 return {ok:true,reason:'awarded',amount:offer.amount};
}
