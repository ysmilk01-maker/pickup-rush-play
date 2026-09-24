export const COLORS = {
  red: { label: "빨강", short: "●", hex: "#ff5f6d" },
  blue: { label: "파랑", short: "◆", hex: "#438df3" },
  green: { label: "초록", short: "▲", hex: "#3ecb72" },
  yellow: { label: "노랑", short: "★", hex: "#ffd23f" },
  purple: { label: "보라", short: "⬟", hex: "#a86bea" },
  cyan: { label: "하늘", short: "⬢", hex: "#30c9c7" },
  orange: { label: "주황", short: "✦", hex: "#ff914d" }
};

const repeat = (color, count) => Array.from({ length: count }, () => color);

const layouts = {
  starter: {
    cols: 6,
    rows: 6,
    cars: [
      { key: "a", r: 0, c: 3, dir: "D", len: 2 },
      { key: "b", r: 0, c: 0, dir: "R", len: 2 },
      { key: "c", r: 3, c: 0, dir: "R", len: 2 }
    ],
    solution: ["a", "b", "c"]
  },
  cross: {
    cols: 6,
    rows: 6,
    cars: [
      { key: "a", r: 0, c: 0, dir: "D", len: 2 },
      { key: "b", r: 3, c: 0, dir: "R", len: 2 },
      { key: "c", r: 2, c: 4, dir: "U", len: 2 },
      { key: "d", r: 5, c: 2, dir: "R", len: 2 }
    ],
    solution: ["c", "b", "a", "d"]
  },
  junction: {
    cols: 6,
    rows: 6,
    cars: [
      { key: "a", r: 0, c: 1, dir: "D", len: 2 },
      { key: "b", r: 2, c: 3, dir: "L", len: 2 },
      { key: "c", r: 4, c: 3, dir: "U", len: 2 },
      { key: "d", r: 1, c: 5, dir: "D", len: 2 }
    ],
    solution: ["a", "b", "c", "d"]
  },
  avenue: {
    cols: 7,
    rows: 7,
    cars: [
      { key: "a", r: 0, c: 5, dir: "D", len: 2 },
      { key: "b", r: 3, c: 4, dir: "L", len: 2 },
      { key: "c", r: 5, c: 1, dir: "R", len: 2 },
      { key: "d", r: 2, c: 0, dir: "D", len: 2 },
      { key: "e", r: 6, c: 3, dir: "R", len: 2 }
    ],
    solution: ["d", "b", "a", "c", "e"]
  },
  rush: {
    cols: 7,
    rows: 7,
    cars: [
      { key: "a", r: 0, c: 0, dir: "R", len: 2 },
      { key: "b", r: 0, c: 4, dir: "D", len: 2 },
      { key: "c", r: 3, c: 2, dir: "L", len: 2 },
      { key: "d", r: 5, c: 3, dir: "U", len: 2 },
      { key: "e", r: 6, c: 0, dir: "R", len: 2 },
      { key: "f", r: 4, c: 5, dir: "D", len: 2 }
    ],
    solution: ["b", "a", "c", "d", "e", "f"]
  }
};

function stage({ prefix, title, district, difficulty, layout, colors, queueOrder }) {
  const template = layouts[layout];
  const cars = template.cars.map((car, index) => ({ ...car, id: `${prefix}${car.key}`, color: colors[index] }));
  const byKey = Object.fromEntries(cars.map((car) => [car.key, car]));
  const solutionKeys = template.solution;
  const queueKeys = queueOrder || solutionKeys;
  return {
    title,
    district,
    difficulty,
    cols: template.cols,
    rows: template.rows,
    cars: cars.map(({ key, ...car }) => car),
    queue: queueKeys.flatMap((key) => repeat(byKey[key].color, 3)),
    solution: solutionKeys.map((key) => byKey[key].id)
  };
}

export const LEVELS = [
  stage({ prefix: "s1", title: "출근 첫차", district: "다운타운", difficulty: 1, layout: "starter", colors: ["blue", "red", "green"] }),
  stage({ prefix: "s2", title: "환승 구간", district: "다운타운", difficulty: 1, layout: "cross", colors: ["yellow", "purple", "blue", "red"] }),
  stage({ prefix: "s3", title: "도심 교차로", district: "다운타운", difficulty: 2, layout: "junction", colors: ["yellow", "red", "green", "blue"], queueOrder: ["c", "b", "d", "a"] }),
  stage({ prefix: "s4", title: "시장 앞 혼잡", district: "다운타운", difficulty: 2, layout: "avenue", colors: ["purple", "green", "yellow", "blue", "red"] }),
  stage({ prefix: "s5", title: "강변 진입로", district: "리버사이드", difficulty: 2, layout: "cross", colors: ["cyan", "orange", "green", "purple"] }),
  stage({ prefix: "s6", title: "무지개 정류장", district: "리버사이드", difficulty: 3, layout: "rush", colors: ["yellow", "blue", "purple", "red", "green", "cyan"] }),
  stage({ prefix: "s7", title: "공원 순환선", district: "리버사이드", difficulty: 3, layout: "avenue", colors: ["orange", "cyan", "yellow", "purple", "green"], queueOrder: ["b", "d", "a", "c", "e"] }),
  stage({ prefix: "s8", title: "퇴근 러시아워", district: "리버사이드", difficulty: 3, layout: "rush", colors: ["green", "red", "cyan", "yellow", "purple", "orange"], queueOrder: ["a", "b", "c", "d", "e", "f"] }),
  stage({ prefix: "s9", title: "네온 사거리", district: "나이트 시티", difficulty: 4, layout: "junction", colors: ["purple", "orange", "blue", "cyan"], queueOrder: ["b", "a", "d", "c"] }),
  stage({ prefix: "s10", title: "심야 환승", district: "나이트 시티", difficulty: 4, layout: "avenue", colors: ["red", "cyan", "green", "orange", "yellow"], queueOrder: ["a", "d", "b", "c", "e"] }),
  stage({ prefix: "s11", title: "터미널 대혼잡", district: "나이트 시티", difficulty: 5, layout: "rush", colors: ["orange", "purple", "blue", "green", "red", "yellow"], queueOrder: ["c", "b", "a", "d", "e", "f"] }),
  stage({ prefix: "s12", title: "마지막 운행", district: "나이트 시티", difficulty: 5, layout: "rush", colors: ["cyan", "yellow", "red", "purple", "orange", "green"], queueOrder: ["a", "c", "b", "d", "f", "e"] })
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
    bays: [null, null, null],
    history: [],
    status: "playing",
    message: "화살표 앞이 열린 차량을 보내세요.",
    boosters: { rotateQueue: 1, extraBay: 1 },
    adRewardClaimed: false,
    rewardedBays: 0,
    moves: 0
  };
}

export function cellsFor(car) {
  const cells = [];
  for (let i = 0; i < car.len; i += 1) {
    cells.push({ r: car.r + ((car.dir === "U" || car.dir === "D") ? i : 0), c: car.c + ((car.dir === "L" || car.dir === "R") ? i : 0) });
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
  state.bays[bayIndex] = { id: car.id, color: car.color, seats: 3 };
  state.moves += 1;
  state.message = `${COLORS[car.color].label} 차량이 정류장에 도착했습니다.`;
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
  if (rewardedBays > 0) state.adRewardClaimed = true;
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
  if (state.status === "won" || !state.boosters.extraBay) return false;
  saveHistory(state);
  state.boosters.extraBay -= 1;
  state.bays.push(null);
  state.status = "playing";
  state.message = "부스터로 임시 대기 칸을 열었습니다.";
  return true;
}

export function grantRewardedBay(state) {
  if (state.status === "won" || state.adRewardClaimed) return false;
  state.adRewardClaimed = true;
  state.rewardedBays = (state.rewardedBays || 0) + 1;
  state.bays.push(null);
  state.status = "playing";
  state.message = "광고 보상으로 대기 칸 1개가 열렸습니다.";
  return true;
}
