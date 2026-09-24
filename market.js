import { Traffic } from './traffic.js?v=23';
import { canExit, LEVELS } from './game.js?v=23';

// Presentation only. Dispatch, FIFO loading, capacity, departure, undo and loss
// are inherited unchanged from the original passenger game.
export const STALL_ICONS = ['🍜','🍢','🥟','🍕','🍔','🧋'];
export const DISTRICTS = [
 {name:'등불 골목',subtitle:'맛있는 저녁이 시작되는 곳',icon:'🏮',color:'#ffbd79'},
 {name:'달빛 강변',subtitle:'강바람을 따라 떠나는 야식 여행',icon:'🌙',color:'#83ded9'},
 {name:'별빛 항구',subtitle:'마지막 셔틀까지 반짝이는 밤',icon:'✨',color:'#c4b1ff'}
];
const names=['첫 번째 불빛','골목의 저녁','북적이는 시장','포장마차 거리','저녁 약속','노을 정류장','손님맞이','한입 산책','금요일의 열기','야시장 막차','마지막 환승','축제의 밤'];
export const MARKET_LEVELS=LEVELS.map((_,i)=>`${DISTRICTS[Math.floor(i/12)].name} · ${names[i%12]}`);
export class Market extends Traffic {
  constructor(level=0){super(level);this.state.levelTitle=MARKET_LEVELS[this.state.levelIndex];}
  get busy(){return !!(this.running.length||this.walkers.length);}
  get canUndo(){return !this.busy&&this.undoStack.length>0;}
  readySuggestion(){
    return this.state.cars.find(c=>canExit(this.state,c)&&c.color===this.state.queue[0])
      ||this.state.cars.find(c=>canExit(this.state,c));
  }
}
