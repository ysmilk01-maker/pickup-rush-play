export const COLORS = {
  red: { label: "빨강", short: "●", hex: "#ff5d68" },
  blue: { label: "파랑", short: "◆", hex: "#4597ff" },
  green: { label: "초록", short: "▲", hex: "#35c98a" },
  yellow: { label: "노랑", short: "★", hex: "#f6c84d" },
  purple: { label: "보라", short: "⬟", hex: "#a878ff" }
};

const repeat = (color, count) => Array.from({ length: count }, () => color);

export const LEVELS = [
  {
    title: "출근 첫차",
    cols: 6,
    rows: 6,
    queue: [...repeat("blue", 3), ...repeat("red", 3), ...repeat("green", 3)],
    cars: [
      { id: "b1", color: "blue", r: 0, c: 3, dir: "D", len: 2 },
      { id: "r1", color: "red", r: 0, c: 0, dir: "R", len: 2 },
      { id: "g1", color: "green", r: 3, c: 0, dir: "R", len: 2 }
    ]
  },
  {
    title: "환승 구간",
    cols: 6,
    rows: 6,
    queue: [...repeat("blue", 3), ...repeat("purple", 3), ...repeat("yellow", 3), ...repeat("red", 3)],
    cars: [
      { id: "y2", color: "yellow", r: 0, c: 0, dir: "D", len: 2 },
      { id: "p2", color: "purple", r: 3, c: 0, dir: "R", len: 2 },
      { id: "b2", color: "blue", r: 2, c: 4, dir: "U", len: 2 },
      { id: "r2", color: "red", r: 5, c: 2, dir: "R", len: 2 }
    ]
  },
  {
    title: "도심 교차로",
    cols: 6,
    rows: 6,
    queue: [...repeat("green", 3), ...repeat("red", 3), ...repeat("blue", 3), ...repeat("yellow", 3)],
    cars: [
      { id: "y3", color: "yellow", r: 0, c: 1, dir: "D", len: 2 },
      { id: "r3", color: "red", r: 2, c: 3, dir: "L", len: 2 },
      { id: "g3", color: "green", r: 4, c: 3, dir: "U", len: 2 },
      { id: "b3", color: "blue", r: 1, c: 5, dir: "D", len: 2 }
    ]
  },
  {
    title: "야간 정류장",
    cols: 7,
    rows: 7,
    queue: [...repeat("purple", 3), ...repeat("green", 3), ...repeat("yellow", 3), ...repeat("blue", 3), ...repeat("red", 3)],
    cars: [
      { id: "p4", color: "purple", r: 0, c: 5, dir: "D", len: 2 },
      { id: "g4", color: "green", r: 3, c: 4, dir: "L", len: 2 },
      { id: "y4", color: "yellow", r: 5, c: 1, dir: "R", len: 2 },
      { id: "b4", color: "blue", r: 2, c: 0, dir: "D", len: 2 },
      { id: "r4", color: "red", r: 6, c: 3, dir: "R", len: 2 }
    ]
  },
  {
    title: "러시아워",
    cols: 7,
    rows: 7,
    queue: [...repeat("yellow", 3), ...repeat("blue", 3), ...repeat("purple", 3), ...repeat("red", 3), ...repeat("green", 3), ...repeat("blue", 3)],
    cars: [
      { id: "y5", color: "yellow", r: 0, c: 0, dir: "R", len: 2 },
      { id: "b5a", color: "blue", r: 0, c: 4, dir: "D", len: 2 },
      { id: "p5", color: "purple", r: 3, c: 2, dir: "L", len: 2 },
      { id: "r5", color: "red", r: 5, c: 3, dir: "U", len: 2 },
      { id: "g5", color: "green", r: 6, c: 0, dir: "R", len: 2 },
      { id: "b5b", color: "blue", r: 4, c: 5, dir: "D", len: 2 }
    ]
  }
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createGame(levelIndex = 0) {
  const level = LEVELS[Math.max(0, Math.min(levelIndex, LEVELS.length - 1))];
  return {
    levelIndex: LEVELS.indexOf(level),
    levelTitle: level.title,
    cols: level.cols,
    rows: level.rows,
    queue: clone(level.queue),
    cars: clone(level.cars),
    bays: [null, null, null],
    history: [],
    status: "playing",
    message: "앞이 뚫린 차량을 눌러 승객을 태우세요.",
    boosters: { rotateQueue: 1, extraBay: 1 },
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
  const occupied = occupiedMap(state, car.id);
  const cells = cellsFor(car);
  let r;
  let c;
  let dr = 0;
  let dc = 0;
  if (car.dir === "R") {
    ({ r } = cells[0]);
    c = Math.max(...cells.map((cell) => cell.c)) + 1;
    dc = 1;
  } else if (car.dir === "L") {
    ({ r } = cells[0]);
    c = Math.min(...cells.map((cell) => cell.c)) - 1;
    dc = -1;
  } else if (car.dir === "D") {
    ({ c } = cells[0]);
    r = Math.max(...cells.map((cell) => cell.r)) + 1;
    dr = 1;
  } else {
    ({ c } = cells[0]);
    r = Math.min(...cells.map((cell) => cell.r)) - 1;
    dr = -1;
  }
  const path = [];
  while (r >= 0 && r < state.rows && c >= 0 && c < state.cols) {
    path.push({ r, c, blocked: occupied.has(`${r}:${c}`) });
    r += dr;
    c += dc;
  }
  return path;
}

export function canExit(state, car) {
  return exitPath(state, car).every((cell) => !cell.blocked);
}

function saveHistory(state) {
  const snapshot = clone({ ...state, history: [] });
  state.history.push(snapshot);
  if (state.history.length > 20) state.history.shift();
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
    state.message = "대기 칸이 막혔습니다. 되돌리거나 다시 도전하세요.";
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
  state.bays[bayIndex] = { id: car.id, color: car.color, seats: 3 };
  state.moves += 1;
  state.message = `${COLORS[car.color].label} 차량이 정류장에 도착했습니다.`;
  resolveBoarding(state);
  return { ok: true, status: state.status };
}

export function undo(state) {
  const previous = state.history.pop();
  if (!previous) return false;
  const remainingHistory = state.history;
  Object.assign(state, clone(previous), { history: remainingHistory });
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
  if (state.status !== "playing" || !state.boosters.extraBay) return false;
  saveHistory(state);
  state.boosters.extraBay -= 1;
  state.bays.push(null);
  state.message = "임시 대기 칸을 열었습니다.";
  return true;
}
