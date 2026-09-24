import { scatterVehicles } from './layout.js?v=13';
import { blockers, isFreeform, GROUND_SCALE } from './geometry.js?v=13';

export const COLORS = {
  red: { label: "빨강", short: "●", hex: "#ff5f6d" },
  blue: { label: "파랑", short: "◆", hex: "#438df3" },
  green: { label: "초록", short: "▲", hex: "#3ecb72" },
  yellow: { label: "노랑", short: "★", hex: "#ffd23f" },
  purple: { label: "보라", short: "⬟", hex: "#a86bea" },
  cyan: { label: "하늘", short: "⬢", hex: "#30c9c7" },
  orange: { label: "주황", short: "✦", hex: "#ff914d" }
};

export const VEHICLE_TYPES = {
  taxi: { label: "택시", short: "TAXI", len: 1 },
  van: { label: "봉고차", short: "VAN", len: 2 },
  bus: { label: "버스", short: "BUS", len: 3 }
};

const DIRECTION_STEPS = {
  L: [0, -1], R: [0, 1], U: [-1, 0], D: [1, 0],
  NW: [-1, -1], NE: [-1, 1], SW: [1, -1], SE: [1, 1]
};
const DIAGONALS = ["NW", "NE", "SE", "SW"];

const repeat = (color, count) => Array.from({ length: count }, () => color);

const PALETTE = Object.keys(COLORS);
export const BASE_BAYS = 4;
export const MAX_BAYS = 7;

function colorFor(index, shift) {
  return PALETTE[(index * 3 + shift) % PALETTE.length];
}

function solutionFor(cars, rows = 9, cols = 9) {
  const remaining = cars.map((car) => ({ ...car }));
  const solution = [];
  while (remaining.length) {
    const index = remaining.findIndex((car) => canExit({ cars: remaining, rows, cols }, car));
    if (index < 0) throw new Error("Generated traffic layout is locked");
    solution.push(remaining[index].id);
    remaining.splice(index, 1);
  }
  return solution;
}

function denseStage({ prefix, title, district, difficulty, count, layoutSeed, colorShift = 0, rows = 9, cols = 9 }) {
  const cars=scatterVehicles({seed:layoutSeed,count,prefix,colorFor:i=>colorFor(i,colorShift),types:VEHICLE_TYPES});
  const solution=solutionFor(cars,rows,cols);
  const byId=Object.fromEntries(cars.map(car=>[car.id,car]));
  return {title,district,difficulty,cols,rows,cars,queue:solution.flatMap(id=>repeat(byId[id].color,3)),solution};
}

export const LEVELS = [
  denseStage({ prefix: "s1", title: "출근 대혼잡", district: "다운타운", difficulty: 2, count: 40, layoutSeed: 101 }),
  denseStage({ prefix: "s2", title: "사방 환승로", district: "다운타운", difficulty: 2, count: 40, layoutSeed: 211, colorShift: 1 }),
  denseStage({ prefix: "s3", title: "도심 밀집 구역", district: "다운타운", difficulty: 3, count: 40, layoutSeed: 307, colorShift: 2 }),
  denseStage({ prefix: "s4", title: "시장 앞 병목", district: "다운타운", difficulty: 3, count: 40, layoutSeed: 419, colorShift: 3 }),
  denseStage({ prefix: "s5", title: "강변 교차 정체", district: "리버사이드", difficulty: 3, count: 40, layoutSeed: 523, colorShift: 4, rows: 9, cols: 9 }),
  denseStage({ prefix: "s6", title: "무지개 차고", district: "리버사이드", difficulty: 4, count: 40, layoutSeed: 631, colorShift: 5, rows: 9, cols: 9 }),
  denseStage({ prefix: "s7", title: "공원 사방 만차", district: "리버사이드", difficulty: 4, count: 40, layoutSeed: 743, colorShift: 6, rows: 9, cols: 9 }),
  denseStage({ prefix: "s8", title: "퇴근 러시아워", district: "리버사이드", difficulty: 4, count: 40, layoutSeed: 857, rows: 9, cols: 9 }),
  denseStage({ prefix: "s9", title: "네온 교차 봉쇄", district: "나이트 시티", difficulty: 5, count: 48, layoutSeed: 967, colorShift: 1, rows: 10, cols: 10 }),
  denseStage({ prefix: "s10", title: "심야 터미널", district: "나이트 시티", difficulty: 5, count: 48, layoutSeed: 1087, colorShift: 3, rows: 10, cols: 10 }),
  denseStage({ prefix: "s11", title: "차고지 완전 봉쇄", district: "나이트 시티", difficulty: 5, count: 48, layoutSeed: 1193, colorShift: 5, rows: 10, cols: 10 }),
  denseStage({ prefix: "s12", title: "마지막 초대형 정체", district: "나이트 시티", difficulty: 5, count: 48, layoutSeed: 1297, colorShift: 6, rows: 10, cols: 10 })
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createGame(levelIndex = 0) {
  const level = LEVELS[Math.max(0, Math.min(levelIndex, LEVELS.length - 1))];
  return {
    levelIndex: LEVELS.indexOf(level),
    levelTitle: level.title,
    district: level.district,
    difficulty: level.difficulty,
    cols: level.cols,
    rows: level.rows,
    queue: clone(level.queue),
    cars: clone(level.cars),
    bays: Array.from({ length: BASE_BAYS }, () => null),
    history: [],
    status: "playing",
    message: "화살표 앞이 열린 차량을 보내세요.",
    boosters: { rotateQueue: 1, extraBay: 1 },
    rewardedBays: 0,
    moves: 0
  };
}

export function cellsFor(car) {
  const cells = [];
  for (let i = 0; i < car.len; i += 1) {
    cells.push({
      r: car.r + ((car.dir === "U" || car.dir === "D") ? i : 0),
      c: car.c + ((car.dir === "L" || car.dir === "R") ? i : 0)
    });
  }
  return cells;
}

function occupiedMap(state, ignoreId = null) {
  const occupied = new Set();
  state.cars.filter((car) => car.id !== ignoreId).forEach((car) => {
    cellsFor(car).forEach(({ r, c }) => occupied.add(`${r}:${c}`));
  });
  return occupied;
}

export function exitPath(state, car) {
  if(isFreeform(car)) {
    const hits=blockers(car,state.cars);
    return Array.from({length:24},(_,i)=>{const distance=(i+1)*40;return {x:car.x+Math.cos(car.angle)*distance,y:car.y+Math.sin(car.angle)*distance*GROUND_SCALE,blocked:hits.some(({hit})=>hit.entry<=distance&&hit.exit>=distance-40)};});
  }
  const occupied = occupiedMap(state, car.id);
  const cells = cellsFor(car);
  const [dr, dc] = DIRECTION_STEPS[car.dir];
  const nose = cells.reduce((best, cell) => (cell.r * dr + cell.c * dc > best.r * dr + best.c * dc ? cell : best));
  let r = nose.r + dr;
  let c = nose.c + dc;
  const path = [];
  while (r >= 0 && r < state.rows && c >= 0 && c < state.cols) {
    path.push({ r, c, blocked: occupied.has(`${r}:${c}`) });
    r += dr;
    c += dc;
  }
  return path;
}

export function canExit(state, car) {
  return isFreeform(car) ? blockers(car,state.cars).length===0 : exitPath(state, car).every((cell) => !cell.blocked);
}

function saveHistory(state) {
  const snapshot = clone({ ...state, history: [] });
  state.history.push(snapshot);
  if (state.history.length > 24) state.history.shift();
}

function resolveBoarding(state) {
  let changed = true;
  while (changed && state.queue.length) {
    changed = false;
    for (let i = 0; i < state.bays.length; i += 1) {
      const bay = state.bays[i];
      if (!bay || bay.color !== state.queue[0]) continue;
      while (bay.seats > 0 && state.queue[0] === bay.color) {
        state.queue.shift();
        bay.seats -= 1;
        changed = true;
      }
      if (bay.seats === 0) state.bays[i] = null;
    }
  }

  if (!state.queue.length) {
    state.bays = state.bays.map(() => null);
    state.status = "won";
    state.message = `${state.moves}번 이동으로 정류장을 정리했습니다!`;
    return;
  }

  const full = state.bays.every(Boolean);
  const hasMatch = state.bays.some((bay) => bay && bay.color === state.queue[0]);
  if (full && !hasMatch) {
    state.status = "lost";
    state.message = "대기 칸이 막혔습니다. 부스터를 쓰거나 다시 도전하세요.";
  }
}

export function moveCar(state, carId) {
  if (state.status !== "playing") return { ok: false, reason: state.status };
  const car = state.cars.find((item) => item.id === carId);
  if (!car) return { ok: false, reason: "missing" };
  if (!canExit(state, car)) {
    state.message = "다른 차량이 길을 막고 있어요.";
    return { ok: false, reason: "blocked" };
  }
  const bayIndex = state.bays.findIndex((bay) => !bay);
  if (bayIndex < 0) {
    state.message = "대기 칸이 가득 찼어요.";
    return { ok: false, reason: "bays-full" };
  }
  saveHistory(state);
  state.cars = state.cars.filter((item) => item.id !== carId);
  state.bays[bayIndex] = { id: car.id, color: car.color, type: car.type, seats: 3 };
  state.moves += 1;
  state.message = `${COLORS[car.color].label} ${VEHICLE_TYPES[car.type].label}가 정류장에 도착했습니다.`;
  resolveBoarding(state);
  return { ok: true, status: state.status, bayIndex };
}

export function undo(state) {
  const previous = state.history.pop();
  if (!previous) return false;
  const remainingHistory = state.history;
  const rewardedBays = Math.max(state.rewardedBays || 0, previous.rewardedBays || 0);
  Object.assign(state, clone(previous), { history: remainingHistory });
  while ((state.rewardedBays || 0) < rewardedBays) {
    state.bays.push(null);
    state.rewardedBays = (state.rewardedBays || 0) + 1;
  }
  state.message = "한 수 되돌렸습니다.";
  return true;
}

export function rotateQueue(state) {
  if (state.status !== "playing" || !state.boosters.rotateQueue || state.queue.length < 2) return false;
  saveHistory(state);
  state.boosters.rotateQueue -= 1;
  state.queue.push(state.queue.shift());
  state.message = "첫 승객을 줄 뒤로 보냈습니다.";
  resolveBoarding(state);
  return true;
}

export function addBay(state) {
  if (state.status === "won" || !state.boosters.extraBay || state.bays.length >= MAX_BAYS) return false;
  saveHistory(state);
  state.boosters.extraBay -= 1;
  state.bays.push(null);
  state.status = "playing";
  state.message = "부스터로 임시 대기 칸을 열었습니다.";
  return true;
}

export function grantRewardedBay(state) {
  if (state.status === "won" || state.bays.length >= MAX_BAYS) return false;
  state.rewardedBays = (state.rewardedBays || 0) + 1;
  state.bays.push(null);
  state.status = "playing";
  state.message = "광고 보상으로 대기 칸 1개가 열렸습니다.";
  return true;
}
