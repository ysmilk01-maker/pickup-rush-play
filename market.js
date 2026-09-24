import { Traffic } from './traffic.js?v=19';
import { canExit, COLORS } from './game.js?v=19';

// Presentation only. Dispatch, FIFO loading, capacity, departure, undo and loss
// are inherited unchanged from the original passenger game.
export const CARGO = {
  red: {name:'토마토',icon:'🍅'}, blue: {name:'블루베리',icon:'🫐'},
  green: {name:'채소',icon:'🥬'}, yellow: {name:'옥수수',icon:'🌽'},
  purple: {name:'가지',icon:'🍆'}, cyan: {name:'음료',icon:'🥤'},
  orange: {name:'당근',icon:'🥕'}
};
for(const [color,item] of Object.entries(CARGO))item.mark=COLORS[color].short;
export const MARKET_LEVELS = [
 '첫 번째 불빛','골목의 저녁','북적이는 시장','강변 포장마차',
 '푸드 페스타','강바람 저녁 장사','골목 가득 재료','별빛 미식회',
 '항구의 불금','새벽 배송','전국 야시장','한입 그랜드 오픈'
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
