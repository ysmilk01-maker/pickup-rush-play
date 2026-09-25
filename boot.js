// Each step reflects a completed startup task, not a simulated download percentage.
export async function prepareStartup({loadGame, loadArt, onStep, onSlow = () => {}, artTimeout = 4500, slowAfter = 12000}) {
  let count = 1;
  onStep(count, '야시장에 불을 켜는 중…');
  const slow = setTimeout(onSlow, slowAfter);
  let artTimer;
  const art = Promise.race([
    Promise.resolve().then(loadArt).catch(() => false),
    new Promise(resolve => { artTimer = setTimeout(() => resolve(false), artTimeout); })
  ]).then(() => { clearTimeout(artTimer); onStep(++count, '정류장을 준비하는 중…'); });
  try {
    await Promise.all([
      Promise.resolve().then(loadGame).then(() => onStep(++count, '오늘의 운행을 준비하는 중…')),
      art
    ]);
  } finally { clearTimeout(slow); clearTimeout(artTimer); }
}

if (typeof document !== 'undefined') {
  const loading = document.querySelector('#loading');
  const status = document.querySelector('#boot-status');
  const retry = document.querySelector('#boot-retry');
  const progress = document.querySelector('#boot-progress');
  const surfaces = ['#lobby', '#game'].map(id => document.querySelector(id));
  surfaces.forEach(el => { el.inert = true; });
  retry.onclick = () => location.reload();
  let failed = false;
  const intro=document.querySelector('#studio-intro');
  let dismissIntro;
  const introduction=new Promise(resolve=>{dismissIntro=()=>{intro.hidden=true;resolve();};});
  const introTimer=setTimeout(dismissIntro,1600);
  document.querySelector('#studio-skip').onclick=()=>{clearTimeout(introTimer);dismissIntro();};
  prepareStartup({
    loadGame: () => import('./app.js?v=39'),
    loadArt: () => {
      const art = document.querySelector('#lobby-art');
      return art.decode(); // A missing illustration falls back to the existing Canvas lobby.
    },
    onStep: (count, message) => {
      if (failed) return;
      progress.setAttribute('aria-valuenow', count);
      progress.setAttribute('aria-valuetext', `${count} / 3 준비 완료`);
      document.querySelector('#boot-count').textContent = `${count} / 3`;
      document.querySelectorAll('.boot-step').forEach((el, i) => el.classList.toggle('done', i < count));
      status.textContent = message;
    },
    onSlow: () => {
      status.textContent = '연결이 조금 느려요. 기다리거나 다시 연결해 주세요.';
      retry.hidden = false;
    }
  }).then(async () => {
    await introduction;
    status.textContent = '준비 완료! 야시장으로 출발해요';
    retry.hidden = true;
    loading.classList.add('boot-ready');
    // Startup work runs in parallel with the skippable studio introduction.
    setTimeout(() => {
      const wasFocused = loading.contains(document.activeElement);
      loading.hidden = true;
      surfaces.forEach(el => { el.inert = false; });
      if (wasFocused) document.querySelector('#play').focus();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  }).catch(() => {
    clearTimeout(introTimer);dismissIntro();
    failed = true;
    loading.classList.add('boot-error');
    status.textContent = '운행 정보를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.';
    retry.hidden = false;
  });
}
