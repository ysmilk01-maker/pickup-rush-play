import { Traffic } from './traffic.js?v=54';
import { canExit, LEVELS } from './game.js?v=54';

// Presentation only. Dispatch, FIFO loading, capacity, departure, undo and loss
// are inherited unchanged from the original passenger game.
export const STALL_ICONS = ['🍜','🍢','🥟','🍕','🍔','🧋'];
import {DISTRICTS,LEVELS_PER_DISTRICT} from './campaign.js?v=54';
export {DISTRICTS};
const names=['첫 번째 불빛','골목의 저녁','북적이는 시장','포장마차 거리','저녁 약속','노을 정류장','손님맞이','한입 산책','금요일의 열기','야시장 막차','마지막 환승','축제의 밤'];
export const MARKET_LEVELS=LEVELS.map((_,i)=>`${DISTRICTS[Math.floor(i/LEVELS_PER_DISTRICT)].name} · ${names[i%10]}`);
export class Market extends Traffic {
  constructor(level=0,legacy=false,garages=!legacy,campaignVersion=garages?8:3){super(level,legacy,garages,campaignVersion);this.state.levelTitle=MARKET_LEVELS[this.state.levelIndex];}
  get busy(){return this.state.queueCut?.status==='entering'||!!(this.running.length||this.walkers.length||this.arriving.length);}
  get canUndo(){return !this.busy&&this.undoStack.length>0;}
  readySuggestion(){
    return this.state.cars.find(c=>canExit(this.state,c)&&c.color===this.state.queue[0])
      ||this.state.cars.find(c=>canExit(this.state,c));
  }
}
