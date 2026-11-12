(() => {
  'use strict';
  // Add a shared smoothing control to the single-player settings and ease pointer/touch input
  // before the game's own canvas handler receives it.
  const panel = document.getElementById('settingsPanel');
  const canvas = document.getElementById('game');
  if (!panel || !canvas) return;
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = '<label for="singlePlayerSmoothing">Controller smoothing</label><input id="singlePlayerSmoothing" type="range" min="0" max="100" value="35"><span id="singlePlayerSmoothingValue">35%</span>';
  panel.append(row);
  const slider = row.querySelector('#singlePlayerSmoothing');
  const value = row.querySelector('#singlePlayerSmoothingValue');
  let amount = 35, filteredY = null, lastTime = performance.now();
  try { amount = Number(localStorage.getItem('pongControllerSmoothing') || 35); } catch {}
  slider.value = String(Math.max(0, Math.min(100, amount)));
  amount = Number(slider.value); value.textContent = `${amount}%`;
  slider.addEventListener('input', () => {
    amount = Number(slider.value); value.textContent = `${amount}%`;
    try { localStorage.setItem('pongControllerSmoothing', String(amount)); } catch {}
  });
  window.addEventListener('pointerdown', event => {
    if (event.target === canvas) { filteredY = event.clientY; lastTime = performance.now(); }
  }, true);
  window.addEventListener('pointermove', event => {
    if (event.target !== canvas || amount <= 0) return;
    const now = performance.now(), dt = Math.max(.001, Math.min(.1, (now - lastTime) / 1000));
    lastTime = now;
    if (filteredY === null) filteredY = event.clientY;
    const seconds = .015 + (amount / 100) * .30;
    filteredY += (event.clientY - filteredY) * (1 - Math.exp(-dt / seconds));
    try { Object.defineProperty(event, 'clientY', { configurable: true, value: filteredY }); } catch {}
  }, true);
})();
