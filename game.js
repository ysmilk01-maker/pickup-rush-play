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

const PALETTE = Object.keys(COLORS);

function colorFor(index, shift) {
  return PALETTE[(index * 3 + shift) % PALETTE.length];
}

function denseStage({ prefix, title, district, difficulty, count, mode, colorShift = 0 }) {
  const cars = [];
  const solution = [];
  const addCar = (id, r, c, dir) => {
    cars.push({ id, color: colorFor(cars.length, colorShift), r, c, dir, len: 2 });
    return id;
  };

  if (mode === "horizontal") {
    const laneCount = count / 4;
    const rowOffset = Math.floor((8 - laneCount) / 2);
    for (let lane = 0; lane < laneCount; lane += 1) {
      const r = rowOffset + lane;
      const ids = [
        addCar(`${prefix}r${lane}a`, r, 0, "L"),
        addCar(`${prefix}r${lane}b`, r, 2, "L"),
        addCar(`${prefix}r${lane}c`, r, 4, "R"),
        addCar(`${prefix}r${lane}d`, r, 6, "R")
      ];
      solution.push(ids[0], ids[3], ids[1], ids[2]);
    }
  } else if (mode === "vertical") {
    const laneCount = count / 4;
    const colOffset = Math.floor((8 - laneCount) / 2);
    for (let lane = 0; lane < laneCount; lane += 1) {
      const c = colOffset + lane;
      const ids = [
        addCar(`${prefix}c${lane}a`, 0, c, "U"),
        addCar(`${prefix}c${lane}b`, 2, c, "U"),
        addCar(`${prefix}c${lane}c`, 4, c, "D"),
        addCar(`${prefix}c${lane}d`, 6, c, "D")
      ];
      solution.push(ids[0], ids[3], ids[1], ids[2]);
    }
  } else {
    const down = [];
    const up = [];
    for (let c = 0; c < 8; c += 1) down.push(addCar(`${prefix}d${c}`, 6, c, "D"));
    for (let r = 0; r < 4; r += 1) {
      const ids = [
        addCar(`${prefix}h${r}a`, r, 0, "L"),
        addCar(`${prefix}h${r}b`, r, 2, "L"),
        addCar(`${prefix}h${r}c`, r, 4, "R"),
        addCar(`${prefix}h${r}d`, r, 6, "R")
      ];
      solution.push(ids[0], ids[3], ids[1], ids[2]);
    }
    for (let c = 0; c < 8; c += 1) up.push(addCar(`${prefix}u${c}`, 4, c, "U"));
    solution.unshift(...down);
    solution.push(...up);
  }

  const byId = Object.fromEntries(cars.map((car) => [car.id, car]));
  return {
    title,
    district,
    difficulty,
    cols: 8,
    rows: 8,
    cars,
    queue: solution.flatMap((id) => repeat(byId[id].color, 3)),
    solution
  };
}

export const LEVELS = [
  denseStage({ prefix: "s1", title: "출근 대혼잡", district: "다운타운", difficulty: 2, count: 20, mode: "horizontal" }),
  denseStage({ prefix: "s2", title: "수직 환승로", district: "다운타운", difficulty: 2, count: 20, mode: "vertical", colorShift: 1 }),
  denseStage({ prefix: "s3", title: "도심 밀집 구역", district: "다운타운", difficulty: 3, count: 24, mode: "horizontal", colorShift: 2 }),
  denseStage({ prefix: "s4", title: "시장 앞 병목", district: "다운타운", difficulty: 3, count: 24, mode: "vertical", colorShift: 3 }),
  denseStage({ prefix: "s5", title: "강변 정체", district: "리버사이드", difficulty: 3, count: 28, mode: "horizontal", colorShift: 4 }),
  denseStage({ prefix: "s6", title: "무지개 차고", district: "리버사이드", difficulty: 4, count: 28, mode: "vertical", colorShift: 5 }),
  denseStage({ prefix: "s7", title: "공원 만차", district: "리버사이드", difficulty: 4, count: 32, mode: "horizontal", colorShift: 6 }),
  denseStage({ prefix: "s8", title: "퇴근 러시아워", district: "리버사이드", difficulty: 4, count: 32, mode: "vertical" }),
  denseStage({ prefix: "s9", title: "네온 교차 봉쇄", district: "나이트 시티", difficulty: 5, count: 32, mode: "interlocked", colorShift: 1 }),
  denseStage({ prefix: "s10", title: "심야 터미널", district: "나이트 시티", difficulty: 5, count: 32, mode: "interlocked", colorShift: 3 }),
  denseStage({ prefix: "s11", title: "차고지 완전 봉쇄", district: "나이트 시티", difficulty: 5, count: 32, mode: "interlocked", colorShift: 5 }),
  denseStage({ prefix: "s12", title: "마지막 초대형 정체", district: "나이트 시티", difficulty: 5, count: 32, mode: "interlocked", colorShift: 6 })
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
