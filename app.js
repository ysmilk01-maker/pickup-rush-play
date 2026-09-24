import { COLORS, LEVELS, addBay, canExit, createGame, grantRewardedBay, moveCar, rotateQueue, undo } from "./game.js?v=3";
import { platform } from "./platform.js?v=3";

const $ = (selector) => document.querySelector(selector);
const board = $("#board");
const queue = $("#queue");
const bays = $("#bays");
const picker = $("#level-picker");
const overlay = $("#result-overlay");
const adDialog = $("#ad-dialog");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const arrow = { R: "→", L: "←", U: "↑", D: "↓" };

let levelIndex = Math.min(platform.loadProgress(), LEVELS.length - 1);
let state = createGame(levelIndex);
let coins = platform.loadCoins();
let animating = false;
let adReady = false;

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
    slot.setAttribute("aria-label", bay ? `${COLORS[bay.color].label} 차량, 빈 좌석 ${bay.seats}` : `빈 대기 칸 ${index + 1}`);
    slot.innerHTML = bay
      ? `<span class="bay-car">${COLORS[bay.color].short}</span><span class="seat-count">${bay.seats}석</span>`
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
    const ready = canExit(state, car);
    const button = document.createElement("button");
    button.className = `car color-${car.color} ${ready ? "ready" : "blocked"}`;
    button.style.left = `calc(${car.c} * 100% / ${state.cols} + 3px)`;
    button.style.top = `calc(${car.r} * 100% / ${state.rows} + 3px)`;
    button.style.width = `calc(${horizontal ? car.len : 1} * 100% / ${state.cols} - 6px)`;
    button.style.height = `calc(${horizontal ? 1 : car.len} * 100% / ${state.rows} - 6px)`;
    button.dataset.id = car.id;
    button.dataset.dir = car.dir;
    button.setAttribute("aria-label", `${COLORS[car.color].label} 차량, ${arrow[car.dir]} 방향${ready ? ", 이동 가능" : ", 길 막힘"}`);
    button.innerHTML = `<span class="car-mark">${COLORS[car.color].short}</span><span class="car-arrow">${arrow[car.dir]}</span>`;
    return button;
  }));
}

function renderControls() {
  $("#undo").disabled = !state.history.length || animating;
  $("#rotate").disabled = !state.boosters.rotateQueue || state.status !== "playing" || animating;
  $("#extra-bay").disabled = !state.boosters.extraBay || state.status === "won" || animating;
  $("#rewarded-bay").disabled = state.adRewardClaimed || state.status === "won" || animating;
  $("#rotate-count").textContent = state.boosters.rotateQueue;
  $("#bay-count").textContent = state.boosters.extraBay;
  $("#rewarded-bay .control-label").textContent = state.adRewardClaimed ? "광고 보상 받음" : "광고 보고 +1칸";
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
    : (state.adRewardClaimed ? "다시 도전" : "광고 보고 +1칸으로 계속");
  $(".result-kicker").textContent = won ? "STAGE CLEAR" : "NEED MORE SPACE";
}

function render() {
  $("#level-label").textContent = `LEVEL ${state.levelIndex + 1} / ${LEVELS.length}`;
  $("#level-title").textContent = state.levelTitle;
  $("#district-label").textContent = state.district;
  $("#traffic-label").textContent = `남은 차량 ${state.cars.length}대`;
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

async function animateCarToBay(carElement, bayElement) {
  if (reduceMotion.matches || !carElement.animate || !bayElement) return;
  const start = carElement.getBoundingClientRect();
  const target = bayElement.getBoundingClientRect();
  const dx = target.left + target.width / 2 - (start.left + start.width / 2);
  const dy = target.top + target.height / 2 - (start.top + start.height / 2);
  const nudge = { R: [26, 0], L: [-26, 0], U: [0, -26], D: [0, 26] }[carElement.dataset.dir];
  const ghost = carElement.cloneNode(true);
  ghost.classList.add("travel-car");
  ghost.style.left = `${start.left}px`;
  ghost.style.top = `${start.top}px`;
  ghost.style.width = `${start.width}px`;
  ghost.style.height = `${start.height}px`;
  document.body.append(ghost);
  carElement.style.opacity = "0";
  await ghost.animate([
    { transform: "translate(0, 0) scale(1)" },
    { transform: `translate(${nudge[0]}px, ${nudge[1]}px) scale(1.04)`, offset: .22 },
    { transform: `translate(${dx}px, ${dy}px) scale(.56)` }
  ], { duration: 290, easing: "cubic-bezier(.77, 0, .175, 1)", fill: "forwards" }).finished.catch(() => {});
  ghost.remove();
}

async function animatePassengersToBay(passengers, bayIndex) {
  if (reduceMotion.matches || !passengers.length) return;
  const target = bays.children[bayIndex]?.getBoundingClientRect();
  if (!target) return;
  await Promise.all(passengers.map(async (passenger, index) => {
    const ghost = document.createElement("span");
    ghost.className = `${passenger.className} boarding-passenger`;
    ghost.textContent = passenger.text;
    ghost.style.left = `${passenger.rect.left}px`;
    ghost.style.top = `${passenger.rect.top}px`;
    ghost.style.width = `${passenger.rect.width}px`;
    ghost.style.height = `${passenger.rect.height}px`;
    document.body.append(ghost);
    const dx = target.left + target.width / 2 - (passenger.rect.left + passenger.rect.width / 2);
    const dy = target.top + target.height / 2 - (passenger.rect.top + passenger.rect.height / 2);
    await ghost.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * .55}px, ${dy * .55}px) scale(.9)`, opacity: 1, offset: .65 },
      { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: .15 }
    ], { duration: 250, delay: index * 45, easing: "cubic-bezier(.23, 1, .32, 1)", fill: "forwards" }).finished.catch(() => {});
    ghost.remove();
  }));
}

board.addEventListener("click", async (event) => {
  const carElement = event.target.closest(".car");
  if (!carElement || animating) return;
  const car = state.cars.find((item) => item.id === carElement.dataset.id);
  if (!car || !canExit(state, car)) {
    carElement.classList.remove("is-blocked");
    requestAnimationFrame(() => carElement.classList.add("is-blocked"));
    state.message = "다른 차량이 길을 막고 있어요.";
    $("#message").textContent = state.message;
    platform.haptic("light");
    return;
  }

  animating = true;
  renderControls();
  const bayIndex = state.bays.findIndex((bay) => !bay);
  const bayElement = bays.children[bayIndex];
  const passengers = captureBoardingPassengers(car.color);
  await animateCarToBay(carElement, bayElement);
  const outcome = moveCar(state, carElement.dataset.id);
  platform.haptic(outcome.ok ? (state.status === "won" ? "success" : "light") : "light");
  if (state.status === "won") {
    platform.saveProgress(Math.min(state.levelIndex + 1, LEVELS.length - 1));
    coins += 20;
    platform.saveCoins(coins);
    platform.emit("level-complete", { level: state.levelIndex + 1, moves: state.moves });
  }
  render();
  await animatePassengersToBay(passengers, outcome.bayIndex);
  animating = false;
  renderControls();
  renderResult();
});

async function openRewardedAd() {
  if (state.adRewardClaimed || state.status === "won") return;
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
  if (state.status === "lost" && !state.adRewardClaimed) {
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
  navigator.serviceWorker.register("./sw.js?v=3").catch(() => {});
}
