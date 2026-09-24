import { COLORS, LEVELS, addBay, canExit, createGame, moveCar, rotateQueue, undo } from "./game.js";
import { platform } from "./platform.js";

const board = document.querySelector("#board");
const queue = document.querySelector("#queue");
const bays = document.querySelector("#bays");
const levelLabel = document.querySelector("#level-label");
const levelTitle = document.querySelector("#level-title");
const message = document.querySelector("#message");
const moveLabel = document.querySelector("#move-count");
const overlay = document.querySelector("#result-overlay");
const resultTitle = document.querySelector("#result-title");
const resultCopy = document.querySelector("#result-copy");
const nextButton = document.querySelector("#next-level");
const picker = document.querySelector("#level-picker");

let levelIndex = Math.min(platform.loadProgress(), LEVELS.length - 1);
let state = createGame(levelIndex);

const arrow = { R: "→", L: "←", U: "↑", D: "↓" };

function renderQueue() {
  queue.replaceChildren(...state.queue.slice(0, 14).map((color, index) => {
    const person = document.createElement("span");
    person.className = `passenger color-${color}${index === 0 ? " first" : ""}`;
    person.textContent = COLORS[color].short;
    person.title = `${COLORS[color].label} 승객${index === 0 ? ", 다음 탑승" : ""}`;
    return person;
  }));
  document.querySelector("#queue-count").textContent = `${state.queue.length}명`;
}

function renderBays() {
  bays.replaceChildren(...state.bays.map((bay, index) => {
    const slot = document.createElement("div");
    slot.className = `bay${bay ? ` occupied color-${bay.color}` : ""}`;
    slot.setAttribute("aria-label", bay ? `${COLORS[bay.color].label} 차량, 빈 좌석 ${bay.seats}` : `빈 대기 칸 ${index + 1}`);
    slot.innerHTML = bay
      ? `<span class="bay-car">${COLORS[bay.color].short}</span><span class="seat-count">${bay.seats}석</span>`
      : `<span class="plus">+</span><span>대기</span>`;
    return slot;
  }));
}

function renderBoard() {
  board.style.setProperty("--cols", state.cols);
  board.style.setProperty("--rows", state.rows);
  board.replaceChildren(...state.cars.map((car) => {
    const horizontal = car.dir === "R" || car.dir === "L";
    const button = document.createElement("button");
    button.className = `car color-${car.color}${canExit(state, car) ? " ready" : " blocked"}`;
    button.style.left = `calc(${car.c} * 100% / ${state.cols} + 3px)`;
    button.style.top = `calc(${car.r} * 100% / ${state.rows} + 3px)`;
    button.style.width = `calc(${horizontal ? car.len : 1} * 100% / ${state.cols} - 6px)`;
    button.style.height = `calc(${horizontal ? 1 : car.len} * 100% / ${state.rows} - 6px)`;
    button.dataset.id = car.id;
    button.setAttribute("aria-label", `${COLORS[car.color].label} 차량 ${arrow[car.dir]} 방향`);
    button.innerHTML = `<span class="car-mark">${COLORS[car.color].short}</span><span class="car-arrow">${arrow[car.dir]}</span>`;
    return button;
  }));
}

function renderControls() {
  document.querySelector("#undo").disabled = !state.history.length;
  document.querySelector("#rotate").disabled = !state.boosters.rotateQueue || state.status !== "playing";
  document.querySelector("#extra-bay").disabled = !state.boosters.extraBay || state.status !== "playing";
  document.querySelector("#rotate-count").textContent = state.boosters.rotateQueue;
  document.querySelector("#bay-count").textContent = state.boosters.extraBay;
  moveLabel.textContent = `${state.moves}수`;
}

function renderResult() {
  const finished = state.status !== "playing";
  overlay.hidden = !finished;
  if (!finished) return;
  const won = state.status === "won";
  resultTitle.textContent = won ? "승차 완료!" : "정류장 혼잡";
  resultCopy.textContent = state.message;
  nextButton.textContent = won && state.levelIndex < LEVELS.length - 1 ? "다음 스테이지" : "다시 도전";
}

function render() {
  levelLabel.textContent = `STAGE ${state.levelIndex + 1} / ${LEVELS.length}`;
  levelTitle.textContent = state.levelTitle;
  picker.value = String(state.levelIndex);
  message.textContent = state.message;
  renderQueue();
  renderBays();
  renderBoard();
  renderControls();
  renderResult();
}

function loadLevel(nextIndex) {
  levelIndex = Math.max(0, Math.min(nextIndex, LEVELS.length - 1));
  state = createGame(levelIndex);
  overlay.hidden = true;
  render();
}

board.addEventListener("click", (event) => {
  const car = event.target.closest(".car");
  if (!car) return;
  const outcome = moveCar(state, car.dataset.id);
  platform.haptic(outcome.ok ? (state.status === "won" ? "success" : "light") : "light");
  if (state.status === "won") {
    platform.saveProgress(Math.min(state.levelIndex + 1, LEVELS.length - 1));
    platform.emit("level-complete", { level: state.levelIndex + 1, moves: state.moves });
  }
  render();
});

document.querySelector("#undo").addEventListener("click", () => { undo(state); render(); });
document.querySelector("#reset").addEventListener("click", () => loadLevel(state.levelIndex));
document.querySelector("#rotate").addEventListener("click", () => { rotateQueue(state); render(); });
document.querySelector("#extra-bay").addEventListener("click", () => { addBay(state); render(); });
picker.addEventListener("change", () => loadLevel(Number(picker.value)));
nextButton.addEventListener("click", () => {
  loadLevel(state.status === "won" && state.levelIndex < LEVELS.length - 1 ? state.levelIndex + 1 : state.levelIndex);
});
document.querySelector("#close-result").addEventListener("click", () => { overlay.hidden = true; });
document.querySelector("#help").addEventListener("click", () => document.querySelector("#help-dialog").showModal());
document.querySelector("#close-help").addEventListener("click", () => document.querySelector("#help-dialog").close());

picker.replaceChildren(...LEVELS.map((level, index) => {
  const option = document.createElement("option");
  option.value = String(index);
  option.textContent = `${index + 1}. ${level.title}`;
  return option;
}));

render();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
