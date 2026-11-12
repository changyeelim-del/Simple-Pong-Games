(() => {
  'use strict';
  const canvas = document.getElementById('game');
  if (!canvas) return;

  let running = false;
  let bypass = false;

  function showCountdown() {
    return new Promise(resolve => {
      const layer = document.createElement('div');
      Object.assign(layer.style, {
        position: 'fixed', display: 'grid', placeItems: 'center', zIndex: '10000',
        pointerEvents: 'none', color: '#fff', font: '900 clamp(56px, 18vw, 140px)/1 system-ui, sans-serif',
        textShadow: '0 0 18px #32dcff, 0 0 42px #32dcff',
        background: 'linear-gradient(135deg, #07101dcc, #10182799)',
        border: '2px solid #45d9ff', borderRadius: '12px', boxShadow: '0 0 26px #31d9ff66'
      });
      document.body.append(layer);
      const place = () => {
        const rect = canvas.getBoundingClientRect();
        layer.style.left = `${rect.left}px`; layer.style.top = `${rect.top}px`;
        layer.style.width = `${rect.width}px`; layer.style.height = `${rect.height}px`;
      };
      place();
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
      let count = 3;
      layer.textContent = String(count);
      const timer = window.setInterval(() => {
        count--;
        if (count > 0) layer.textContent = String(count);
        else if (count === 0) layer.textContent = 'GO!';
        else {
          clearInterval(timer); window.removeEventListener('resize', place);
          window.removeEventListener('scroll', place, true); layer.remove(); resolve();
        }
      }, 1000);
    });
  }

  function attach(id) {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener('click', async event => {
      if (bypass || running) return;
      event.preventDefault(); event.stopImmediatePropagation();
      running = true;
      try {
        await showCountdown();
        bypass = true; button.click(); bypass = false;
      } finally { running = false; bypass = false; }
    }, true);
  }

  // Cover new games, next adventure maps/tournament rounds, and pause-menu restarts.
  attach('startButton');
  attach('restartButton');
})();
