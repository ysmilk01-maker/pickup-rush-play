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

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
}

function vehiclePlan(count) {
  if (count <= 20) return { taxi: 4, van: 12, bus: 4 };
  if (count <= 24) return { taxi: 6, van: 14, bus: 4 };
  if (count <= 28) return { taxi: 8, van: 14, bus: 6 };
  return { taxi: 8, van: 18, bus: 6 };
}

function packedVehicles(seed, count, rows = 8, cols = 8) {
  const random = seededRandom(seed);
  const occupied = new Set();
  const vehicles = [];
  const remaining = vehiclePlan(count);
  let holes = rows * cols - Object.entries(remaining).reduce((sum, [type, amount]) => sum + VEHICLE_TYPES[type].len * amount, 0);
  const key = (r, c) => `${r}:${c}`;
  const available = (cells) => cells.every((cell) => cell.r >= 0 && cell.r < rows && cell.c >= 0 && cell.c < cols && !occupied.has(key(cell.r, cell.c)));

  const fill = () => {
    if (occupied.size === rows * cols) return holes === 0 && Object.values(remaining).every((amount) => amount === 0);
    let first = null;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (!occupied.has(key(r, c))) { first = { r, c }; break; }
      }
      if (first) break;
    }
    if (!first) return false;

    const options = [];
    if (holes > 0) options.push({ type: null, cells: [first] });
    if (remaining.taxi > 0) options.push({ type: "taxi", cells: [first] });
    if (remaining.van > 0) {
      options.push({ type: "van", cells: [first, { r: first.r, c: first.c + 1 }] });
      options.push({ type: "van", cells: [first, { r: first.r + 1, c: first.c }] });
    }
    if (remaining.bus > 0) {
      options.push({ type: "bus", cells: [first, { r: first.r, c: first.c + 1 }, { r: first.r, c: first.c + 2 }] });
      options.push({ type: "bus", cells: [first, { r: first.r + 1, c: first.c }, { r: first.r + 2, c: first.c }] });
    }

    shuffle(options, random);
    for (const option of options.filter((item) => available(item.cells))) {
      option.cells.forEach((cell) => occupied.add(key(cell.r, cell.c)));
      if (option.type) {
        remaining[option.type] -= 1;
        vehicles.push(option);
      } else {
        holes -= 1;
      }
      if (fill()) return true;
      if (option.type) {
        vehicles.pop();
        remaining[option.type] += 1;
      } else {
        holes += 1;
      }
      option.cells.forEach((cell) => occupied.delete(key(cell.r, cell.c)));
    }
    return false;
  };

  if (!fill()) return null;
  return shuffle(vehicles, random);
}

function solutionFor(cars, rows = 8, cols = 8) {
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

function denseStage({ prefix, title, district, difficulty, count, layoutSeed, colorShift = 0 }) {
  for (let attempt = 0; attempt < 96; attempt += 1) {
    const placements = packedVehicles(layoutSeed + attempt * 7919, count);
    if (!placements) continue;
    let taxiIndex = 0;
    const cars = placements.map(({ type, cells }, index) => {
      const rows = cells.map((cell) => cell.r);
      const cols = cells.map((cell) => cell.c);
      const r = Math.min(...rows);
      const c = Math.min(...cols);
      let dir;
      if (type === "taxi") {
        dir = DIAGONALS[(taxiIndex + layoutSeed) % DIAGONALS.length];
        taxiIndex += 1;
      } else if (new Set(rows).size === 1) {
        dir = cols.reduce((sum, value) => sum + value, 0) / cols.length < 3.5 ? "L" : "R";
      } else {
        dir = rows.reduce((sum, value) => sum + value, 0) / rows.length < 3.5 ? "U" : "D";
      }
      return { id: `${prefix}${type[0]}${index}`, color: colorFor(index, colorShift), type, r, c, dir, len: VEHICLE_TYPES[type].len };
    });
    if (!Object.keys(DIRECTION_STEPS).every((dir) => cars.some((car) => car.dir === dir))) continue;
    try {
      const solution = solutionFor(cars);
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
    } catch {
      // Try the next deterministic packing when a dense arrangement locks.
    }
  }
  throw new Error(`Unable to build a solvable mixed vehicle stage for ${prefix}`);
}

export const LEVELS = [
  denseStage({ prefix: "s1", title: "출근 대혼잡", district: "다운타운", difficulty: 2, count: 20, layoutSeed: 101 }),
  denseStage({ prefix: "s2", title: "사방 환승로", district: "다운타운", difficulty: 2, count: 20, layoutSeed: 211, colorShift: 1 }),
  denseStage({ prefix: "s3", title: "도심 밀집 구역", district: "다운타운", difficulty: 3, count: 24, layoutSeed: 307, colorShift: 2 }),
  denseStage({ prefix: "s4", title: "시장 앞 병목", district: "다운타운", difficulty: 3, count: 24, layoutSeed: 419, colorShift: 3 }),
  denseStage({ prefix: "s5", title: "강변 교차 정체", district: "리버사이드", difficulty: 3, count: 28, layoutSeed: 523, colorShift: 4 }),
  denseStage({ prefix: "s6", title: "무지개 차고", district: "리버사이드", difficulty: 4, count: 28, layoutSeed: 631, colorShift: 5 }),
  denseStage({ prefix: "s7", title: "공원 사방 만차", district: "리버사이드", difficulty: 4, count: 32, layoutSeed: 743, colorShift: 6 }),
  denseStage({ prefix: "s8", title: "퇴근 러시아워", district: "리버사이드", difficulty: 4, count: 32, layoutSeed: 857 }),
  denseStage({ prefix: "s9", title: "네온 교차 봉쇄", district: "나이트 시티", difficulty: 5, count: 32, layoutSeed: 967, colorShift: 1 }),
  denseStage({ prefix: "s10", title: "심야 터미널", district: "나이트 시티", difficulty: 5, count: 32, layoutSeed: 1087, colorShift: 3 }),
  denseStage({ prefix: "s11", title: "차고지 완전 봉쇄", district: "나이트 시티", difficulty: 5, count: 32, layoutSeed: 1193, colorShift: 5 }),
  denseStage({ prefix: "s12", title: "마지막 초대형 정체", district: "나이트 시티", difficulty: 5, count: 32, layoutSeed: 1297, colorShift: 6 })
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
