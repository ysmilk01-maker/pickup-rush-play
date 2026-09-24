import { Traffic } from './traffic.js?v=20';
import { canExit } from './game.js?v=20';

// Presentation only. Dispatch, FIFO loading, capacity, departure, undo and loss
// are inherited unchanged from the original passenger game.
export const STALL_ICONS = ['🍜','🍢','🥟','🍕','🍔','🧋'];
export const MARKET_LEVELS = [
 '첫 번째 불빛','골목의 저녁','북적이는 시장','강변 포장마차',
 '푸드 페스타','강바람 저녁 장사','골목 가득 손님','별빛 미식회',
 '항구의 불금','야시장 막차','전국 야시장','한입 그랜드 오픈'
];
export class Market extends Traffic {
  constructor(level=0){super(level);this.state.levelTitle=MARKET_LEVELS[this.state.levelIndex];}
  get busy(){return !!(this.running.length||this.walkers.length);}
  get canUndo(){return !this.busy&&this.undoStack.length>0;}
  readySuggestion(){
    return this.state.cars.find(c=>canExit(this.state,c)&&c.color===this.state.queue[0])
      ||this.state.cars.find(c=>canExit(this.state,c));
  }
}
