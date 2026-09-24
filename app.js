import { COLORS, LEVELS, MAX_BAYS, VEHICLE_TYPES, addBay, canExit, createGame, grantRewardedBay, moveCar, rotateQueue, undo } from "./game.js?v=8";
import { platform } from "./platform.js?v=8";

const $ = (selector) => document.querySelector(selector);
const board = $("#board");
const queue = $("#queue");
const bays = $("#bays");
const picker = $("#level-picker");
const overlay = $("#result-overlay");
const adDialog = $("#ad-dialog");
const toast = $("#game-toast");
const transferRoad = $("#transfer-road");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const arrow = { R: "→", L: "←", U: "↑", D: "↓", NE: "↗", NW: "↖", SE: "↘", SW: "↙" };

let levelIndex = Math.min(platform.loadProgress(), LEVELS.length - 1);
let state = createGame(levelIndex);
let coins = platform.loadCoins();
let animating = false;
let adReady = false;
let toastTimer = 0;

function showToast(message, tone = "warning") {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `game-toast ${tone}`;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("show"));
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { toast.hidden = true; }, 180);
  }, 1450);
}

function renderQueue() {
  queue.replaceChildren(...state.queue.slice(0, 16).map((color, index) => {
    const person = document.createElement("span");
    person.className = `passenger color-${color}${index === 0 ? " first" : ""}`;
    person.style.setProperty("--i", index);
    person.textContent = COLORS[color].short;
    person.title = `${COLORS[color].label} 승객${index === 0 ? ", 다음 탑승" : ""}`;
    person.setAttribute("aria-label", person.title);
    return person;
  }));
  $("#queue-count").textContent = `${state.queue.length}명`;
}

function renderBays() {
  bays.replaceChildren(...state.bays.map((bay, index) => {
    const slot = document.createElement("div");
    slot.className = `bay${bay ? ` occupied color-${bay.color}` : ""}`;
    slot.setAttribute("aria-label", bay ? `${COLORS[bay.color].label} ${VEHICLE_TYPES[bay.type].label}, 빈 좌석 ${bay.seats}` : `빈 대기 칸 ${index + 1}`);
    slot.innerHTML = bay
      ? `<span class="bay-car">${VEHICLE_TYPES[bay.type].short}</span><span class="seat-count">${bay.seats}석</span>`
      : `<span class="plus">＋</span><span>대기</span>`;
    return slot;
  }));
  $("#bay-total").textContent = `${state.bays.length}칸`;
}

function renderBoard() {
  board.style.setProperty("--cols", state.cols);
  board.style.setProperty("--rows", state.rows);
  board.replaceChildren(...state.cars.map((car) => {
    const horizontal = car.dir === "R" || car.dir === "L";
    const vertical = car.dir === "U" || car.dir === "D";
    const diagonal = !horizontal && !vertical;
    const ready = canExit(state, car);
    const button = document.createElement("button");
    button.className = `car type-${car.type} color-${car.color}${diagonal ? " diagonal" : ""} ${ready ? "ready" : "blocked"}`;
    button.style.left = `calc(${car.c} * 100% / ${state.cols} + 3px)`;
    button.style.top = `calc(${car.r} * 100% / ${state.rows} + 3px)`;
    button.style.width = `calc(${horizontal ? car.len : 1} * 100% / ${state.cols} - 6px)`;
    button.style.height = `calc(${vertical ? car.len : 1} * 100% / ${state.rows} - 6px)`;
    button.dataset.id = car.id;
    button.dataset.dir = car.dir;
    button.dataset.type = car.type;
    button.setAttribute("aria-label", `${COLORS[car.color].label} ${VEHICLE_TYPES[car.type].label}, ${arrow[car.dir]} 방향${ready ? ", 이동 가능" : ", 길 막힘"}`);
    const windowCount = car.type === "bus" ? 3 : car.type === "van" ? 2 : 1;
    const windows = Array.from({ length: windowCount }, () => '<i class="vehicle-window"></i>').join("");
    button.innerHTML = `<span class="vehicle-kind">${VEHICLE_TYPES[car.type].short}</span><span class="vehicle-windows" aria-hidden="true">${windows}</span><span class="car-mark">${COLORS[car.color].short}</span><span class="car-arrow">${arrow[car.dir]}</span>`;
    return button;
  }));
}

function renderControls() {
  $("#undo").disabled = !state.history.length || animating;
  $("#rotate").disabled = !state.boosters.rotateQueue || state.status !== "playing" || animating;
  const atMaxBays = state.bays.length >= MAX_BAYS;
  $("#extra-bay").disabled = !state.boosters.extraBay || atMaxBays || state.status === "won" || animating;
  $("#rewarded-bay").disabled = atMaxBays || state.status === "won" || animating;
  $("#rotate-count").textContent = state.boosters.rotateQueue;
  $("#bay-count").textContent = state.boosters.extraBay;
  $("#rewarded-bay .control-label").textContent = atMaxBays ? "최대 7칸" : "광고 보고 +1칸";
  $("#rewarded-bay .ad-tag").textContent = atMaxBays ? "MAX" : `${MAX_BAYS - state.bays.length}`;
  $("#move-count").textContent = `${state.moves}수`;
}

function renderResult() {
  const finished = state.status !== "playing";
  if (finished && animating) {
    overlay.hidden = true;
    return;
  }
  overlay.hidden = !finished;
  if (!finished) return;
  const won = state.status === "won";
  $("#result-title").textContent = won ? "승차 완료!" : "정류장 혼잡";
  $("#result-copy").textContent = state.message;
  $("#next-level").textContent = won
    ? (state.levelIndex < LEVELS.length - 1 ? "다음 스테이지" : "처음부터 다시")
    : (state.bays.length >= MAX_BAYS ? "다시 도전" : "광고 보고 +1칸으로 계속");
  $(".result-kicker").textContent = won ? "STAGE CLEAR" : "NEED MORE SPACE";
}

function render() {
  $("#level-label").textContent = `LEVEL ${state.levelIndex + 1} / ${LEVELS.length}`;
  $("#level-title").textContent = state.levelTitle;
  $("#district-label").textContent = state.district;
  const horizontal = state.cars.filter((car) => car.dir === "L" || car.dir === "R").length;
  const vertical = state.cars.filter((car) => car.dir === "U" || car.dir === "D").length;
  const diagonal = state.cars.length - horizontal - vertical;
  $("#traffic-label").textContent = `${state.cars.length}대 · ↔${horizontal} ↕${vertical} ⤢${diagonal}`;
  $("#difficulty-label").textContent = `난이도 ${"★".repeat(state.difficulty)}${"☆".repeat(5 - state.difficulty)}`;
  $("#level-progress").style.width = `${((state.levelIndex + 1) / LEVELS.length) * 100}%`;
  $("#coin-count").textContent = coins;
  picker.value = String(state.levelIndex);
  $("#message").textContent = state.message;
  renderQueue();
  renderBays();
  renderBoard();
  renderControls();
  renderResult();
}

function loadLevel(nextIndex) {
  levelIndex = Math.max(0, Math.min(nextIndex, LEVELS.length - 1));
  board.classList.add("changing");
  const swap = () => {
    state = createGame(levelIndex);
    overlay.hidden = true;
    render();
    requestAnimationFrame(() => board.classList.remove("changing"));
  };
  if (reduceMotion.matches) swap();
  else setTimeout(swap, 150);
}

function captureBoardingPassengers(color) {
  if (state.queue[0] !== color) return [];
  return [...queue.querySelectorAll(".passenger")].slice(0, 3).map((element) => ({
    className: element.className.replace(" first", ""),
    text: element.textContent,
    rect: element.getBoundingClientRect()
  }));
}

function startExhaustTrail(vehicle) {
  const timer = setInterval(() => {
    if (!vehicle.isConnected) return;
    const rect = vehicle.getBoundingClientRect();
    const puff = document.createElement("span");
    puff.className = "exhaust-puff";
    puff.style.left = `${rect.left + rect.width / 2 + (Math.random() - .5) * 8}px`;
    puff.style.top = `${rect.top + rect.height / 2 + (Math.random() - .5) * 8}px`;
    document.body.append(puff);
    setTimeout(() => puff.remove(), 520);
  }, 78);
  return () => clearInterval(timer);
}

function burstSmoke(x, y, amount = 6) {
  if (reduceMotion.matches) return;
  for (let index = 0; index < amount; index += 1) {
    const puff = document.createElement("span");
    puff.className = "exhaust-puff burst";
    puff.style.left = `${x + (Math.random() - .5) * 20}px`;
    puff.style.top = `${y + (Math.random() - .5) * 12}px`;
    puff.style.setProperty("--burst-x", `${(Math.random() - .5) * 34}px`);
    puff.style.setProperty("--burst-y", `${-10 - Math.random() * 24}px`);
    document.body.append(puff);
    setTimeout(() => puff.remove(), 620);
  }
}

const screenAngle = {
  R: 35, L: 215, U: -35, D: 145,
  NE: 0, SW: 180, NW: -90, SE: 90
};

async function animateCarToBay(carElement, bayElement) {
  if (reduceMotion.matches || !carElement.animate || !bayElement) return { ghost: null, target: bayElement };
  const start = carElement.getBoundingClientRect();
  const target = bayElement.getBoundingClientRect();
  const road = board.getBoundingClientRect();
  const transfer = transferRoad.getBoundingClientRect();
  const dx = target.left + target.width / 2 - (start.left + start.width / 2);
  const dy = target.top + target.height / 2 - (start.top + start.height / 2);
  const vector = {
    R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1],
    NE: [.707, -.707], NW: [-.707, -.707], SE: [.707, .707], SW: [-.707, .707]
  }[carElement.dataset.dir];
  const centerX = start.left + start.width / 2;
  const centerY = start.top + start.height / 2;
  const edgeDistances = [];
  if (vector[0] > 0) edgeDistances.push((road.right - centerX + start.width) / vector[0]);
  if (vector[0] < 0) edgeDistances.push((centerX - road.left + start.width) / -vector[0]);
  if (vector[1] > 0) edgeDistances.push((road.bottom - centerY + start.height) / vector[1]);
  if (vector[1] < 0) edgeDistances.push((centerY - road.top + start.height) / -vector[1]);
  const exitDistance = Math.min(...edgeDistances) + 18;
  const exitX = vector[0] * exitDistance;
  const exitY = vector[1] * exitDistance;
  const roadY = transfer.top + transfer.height * .55 - centerY;
  const laneX = Math.max(transfer.left + 28, Math.min(transfer.right - 28, centerX + exitX)) - centerX;
  const parkX = target.left + target.width / 2 - centerX;
  const parkY = target.top + target.height / 2 - centerY;
  const ghost = carElement.cloneNode(true);
  ghost.classList.add("travel-car");
  ghost.classList.remove("diagonal", "ready", "blocked");
  ghost.style.left = `${start.left}px`;
  ghost.style.top = `${start.top}px`;
  ghost.style.width = `${start.width}px`;
  ghost.style.height = `${start.height}px`;
  ghost.style.rotate = "0deg";
  ghost.style.setProperty("--travel-angle", `${screenAngle[carElement.dataset.dir]}deg`);
  document.body.append(ghost);
  carElement.style.opacity = "0";
  board.classList.add("launching");
  burstSmoke(centerX, centerY, 7);
  const stopTrail = startExhaustTrail(ghost);
  const duration = { taxi: 760, van: 900, bus: 1060 }[carElement.dataset.type] || 900;
  await ghost.animate([
    { transform: `translate(0, 0) rotate(${screenAngle[carElement.dataset.dir]}deg) scale(1)` },
    { transform: `translate(${exitX}px, ${exitY}px) rotate(${screenAngle[carElement.dataset.dir]}deg) scale(1.02)`, offset: .38 },
    { transform: `translate(${laneX}px, ${roadY}px) rotate(0deg) scale(.86)`, offset: .58 },
    { transform: `translate(${parkX}px, ${roadY}px) rotate(0deg) scale(.78)`, offset: .8 },
    { transform: `translate(${parkX}px, ${parkY}px) rotate(-7deg) scale(.62)` }
  ], { duration, easing: "cubic-bezier(.42, 0, .16, 1)", fill: "forwards" }).finished.catch(() => {});
  stopTrail();
  board.classList.remove("launching");
  burstSmoke(target.left + target.width / 2, target.top + target.height / 2, 4);
  return { ghost, target: ghost };
}

async function animatePassengersToVehicle(passengers, targetElement) {
  if (reduceMotion.matches || !passengers.length) return;
  const target = targetElement?.getBoundingClientRect();
  if (!target) return;
  [...queue.querySelectorAll(".passenger")].slice(0, passengers.length).forEach((element) => { element.style.opacity = "0"; });
  $("#message").textContent = `${passengers.length}명의 승객이 차량에 탑승 중입니다.`;
  await Promise.all(passengers.map(async (passenger, index) => {
    const ghost = document.createElement("span");
    ghost.className = `${passenger.className} boarding-passenger walking`;
    ghost.textContent = passenger.text;
    ghost.style.left = `${passenger.rect.left}px`;
    ghost.style.top = `${passenger.rect.top}px`;
    ghost.style.width = `${passenger.rect.width}px`;
    ghost.style.height = `${passenger.rect.height}px`;
    document.body.append(ghost);
    const boardingX = target.left + target.width * (.36 + index * .13);
    const boardingY = target.top + target.height * .52;
    const dx = boardingX - (passenger.rect.left + passenger.rect.width / 2);
    const dy = boardingY - (passenger.rect.top + passenger.rect.height / 2);
    await ghost.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * .25}px, ${dy * .25 - 8}px) scale(.98) rotate(-7deg)`, opacity: 1, offset: .25 },
      { transform: `translate(${dx * .5}px, ${dy * .5}px) scale(.9) rotate(7deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx * .76}px, ${dy * .76 - 6}px) scale(.72) rotate(-5deg)`, opacity: 1, offset: .76 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: .05 }
    ], { duration: 560, delay: index * 125, easing: "cubic-bezier(.35, 0, .18, 1)", fill: "forwards" }).finished.catch(() => {});
    ghost.remove();
  }));
}

async function finishArrival(arrival, didBoard) {
  if (!arrival?.ghost) return;
  if (didBoard) {
    await arrival.ghost.animate([
      { opacity: 1, filter: "brightness(1)" },
      { opacity: 1, filter: "brightness(1.22)", offset: .38 },
      { opacity: 0, filter: "brightness(1.08)" }
    ], { duration: 360, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" }).finished.catch(() => {});
  }
  arrival.ghost.remove();
}

board.addEventListener("click", async (event) => {
  const carElement = event.target.closest(".car");
  if (!carElement || animating) return;
  const car = state.cars.find((item) => item.id === carElement.dataset.id);
  if (!car || !canExit(state, car)) {
    carElement.classList.remove("is-blocked");
    requestAnimationFrame(() => carElement.classList.add("is-blocked"));
    state.message = "화살표 앞을 다른 차량이 막고 있어요.";
    $("#message").textContent = state.message;
    showToast("앞 차량을 먼저 빼주세요");
    platform.haptic("light");
    return;
  }

  const bayIndex = state.bays.findIndex((bay) => !bay);
  if (bayIndex < 0) {
    state.message = "주차 공간이 가득 찼습니다.";
    $("#message").textContent = state.message;
    showToast("주차 공간이 가득 찼습니다");
    platform.haptic("light");
    bays.classList.remove("full-shake");
    requestAnimationFrame(() => bays.classList.add("full-shake"));
    return;
  }

  animating = true;
  renderControls();
  const bayElement = bays.children[bayIndex];
  const passengers = captureBoardingPassengers(car.color);
  const arrival = await animateCarToBay(carElement, bayElement);
  await animatePassengersToVehicle(passengers, arrival.target);
  await finishArrival(arrival, passengers.length > 0);
  const outcome = moveCar(state, carElement.dataset.id);
  platform.haptic(outcome.ok ? (state.status === "won" ? "success" : "light") : "light");
  if (state.status === "won") {
    platform.saveProgress(Math.min(state.levelIndex + 1, LEVELS.length - 1));
    coins += 20;
    platform.saveCoins(coins);
    platform.emit("level-complete", { level: state.levelIndex + 1, moves: state.moves });
  }
  render();
  animating = false;
  renderControls();
  renderResult();
});

async function openRewardedAd() {
  if (state.bays.length >= MAX_BAYS || state.status === "won") return;
  adReady = false;
  $("#finish-ad").disabled = true;
  $("#cancel-ad").disabled = true;
  $("#ad-progress-bar").style.width = "0%";
  $("#ad-status").textContent = platform.kind === "web" ? "테스트 광고 재생 중 · 3초" : "보상형 광고 재생 중";
  if (!adDialog.open) adDialog.showModal();
  try {
    const result = await platform.requestRewardedAd((progress) => {
      $("#ad-progress-bar").style.width = `${Math.round(progress * 100)}%`;
      if (platform.kind === "web") $("#ad-status").textContent = `테스트 광고 재생 중 · ${Math.ceil(3 * (1 - progress))}초`;
    });
    adReady = result.rewarded;
    $("#ad-status").textContent = result.rewarded ? "광고 시청 완료 · 보상을 받을 수 있어요." : "광고가 완료되지 않았습니다.";
    $("#finish-ad").disabled = !result.rewarded;
  } catch {
    $("#ad-status").textContent = "광고를 불러오지 못했습니다. 다시 시도해 주세요.";
  } finally {
    $("#cancel-ad").disabled = false;
  }
}

$("#finish-ad").addEventListener("click", () => {
  if (!adReady) return;
  if (grantRewardedBay(state)) {
    platform.emit("rewarded-ad-complete", { placement: "extra-bay", level: state.levelIndex + 1 });
    platform.haptic("success");
  }
  adDialog.close();
  overlay.hidden = true;
  render();
});
$("#cancel-ad").addEventListener("click", () => { if (!$("#cancel-ad").disabled) adDialog.close(); });
$("#rewarded-bay").addEventListener("click", openRewardedAd);

$("#undo").addEventListener("click", () => { undo(state); render(); });
$("#reset").addEventListener("click", () => loadLevel(state.levelIndex));
$("#rotate").addEventListener("click", () => { rotateQueue(state); render(); });
$("#extra-bay").addEventListener("click", () => { addBay(state); overlay.hidden = true; render(); });
picker.addEventListener("change", () => loadLevel(Number(picker.value)));
$("#next-level").addEventListener("click", () => {
  if (state.status === "lost" && state.bays.length < MAX_BAYS) {
    openRewardedAd();
    return;
  }
  if (state.status === "won") loadLevel(state.levelIndex < LEVELS.length - 1 ? state.levelIndex + 1 : 0);
  else loadLevel(state.levelIndex);
});
$("#close-result").addEventListener("click", () => { overlay.hidden = true; });
$("#help").addEventListener("click", () => $("#help-dialog").showModal());
$("#close-help").addEventListener("click", () => $("#help-dialog").close());

picker.replaceChildren(...LEVELS.map((level, index) => {
  const option = document.createElement("option");
  option.value = String(index);
  option.textContent = `${index + 1}. ${level.title}`;
  return option;
}));

render();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js?v=8").catch(() => {});
}
