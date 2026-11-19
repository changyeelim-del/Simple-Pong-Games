(() => {
  'use strict';
  const controls = document.querySelector('.controls');
  const settingsPanel = document.getElementById('settingsPanel');
  const shopPanel = document.querySelector('.shop');
  const modeSelect = document.getElementById('mode');
  if (!controls) return;

  const style = document.createElement('style');
  style.textContent = `
    .game-modal { width:min(680px,calc(100vw - 28px)); max-width:none; max-height:min(88vh,760px); padding:0; border:1px solid #45d9ff; border-radius:14px; color:#eef2ff; background:#101827; box-shadow:0 0 36px #31d9ff66; }
    .game-modal::backdrop { background:#070b12df; backdrop-filter:blur(4px); }
    .game-modal-content { max-height:min(88vh,760px); overflow:auto; padding:16px; }
    .game-modal-header { position:sticky; top:-16px; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:12px; margin:-16px -16px 12px; padding:12px 16px; border-bottom:1px solid #344d6a; background:#101827; }
    .game-modal-header h2 { margin:0; font-size:1.2rem; }
    .game-modal-close { padding:8px 12px; background:#ff8c9f; }
    .game-modal .panel { display:block!important; margin:0; }
    .game-modal .shop { background:transparent; }
    #openPaddleShop { margin:0; }
    #onlineEntry { display:inline-block!important; margin:0; }
    #onlineEntry button { border:0; border-radius:6px; padding:9px 11px; font:inherit; background:#45d9ff; color:#07121e; font-weight:700; cursor:pointer; }
    @media(max-width:520px) { .game-modal-content { padding:12px; } .game-modal-header { top:-12px; margin:-12px -12px 10px; padding:10px 12px; } }
  `;
  document.head.append(style);

  function createDialog(id, title, panel) {
    if (!panel) return null;
    const dialog = document.createElement('dialog');
    dialog.id = id;
    dialog.className = 'game-modal';
    const content = document.createElement('div');
    content.className = 'game-modal-content';
    const header = document.createElement('header');
    header.className = 'game-modal-header';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'game-modal-close';
    close.textContent = '✕ Close';
    close.addEventListener('click', () => dialog.close());
    header.append(heading, close);
    content.append(header, panel);
    dialog.append(content);
    document.body.append(dialog);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  const settingsDialog = createDialog('settingsDialog', '⚙ Settings', settingsPanel);
  const shopDialog = createDialog('shopDialog', '🪙 Paddle Shop', shopPanel);
  const settingsButton = document.getElementById('settingsButton');
  settingsButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (settingsDialog && !settingsDialog.open) settingsDialog.showModal();
  }, true);

  const shopButton = document.createElement('button');
  shopButton.id = 'openPaddleShop';
  shopButton.type = 'button';
  shopButton.textContent = '🪙 Shop';
  controls.append(shopButton);
  shopButton.addEventListener('click', () => {
    if (shopDialog && !shopDialog.open) shopDialog.showModal();
  });

  if (modeSelect) {
    if (!Array.from(modeSelect.options).some(option => option.value === 'multiplayer')) {
      modeSelect.add(new Option('Online Multiplayer', 'multiplayer'));
    }
    let lastMode = modeSelect.value === 'multiplayer' ? 'adventure' : modeSelect.value;

    // Capture the change before the game's original bubble listener. Otherwise its
    // handler treats 'multiplayer' as a single-player mode and resets the game first.
    modeSelect.addEventListener('change', event => {
      if (modeSelect.value !== 'multiplayer') {
        lastMode = modeSelect.value;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      modeSelect.value = lastMode;
      const openOnline = () => {
        const launcher = document.querySelector('#onlineEntry button');
        if (launcher) launcher.click();
        else window.setTimeout(openOnline, 50);
      };
      openOnline();
    }, true);
  }

  function placeOnlineLauncher() {
    const entry = document.getElementById('onlineEntry');
    if (!entry) return false;
    controls.append(entry);
    return true;
  }
  if (!placeOnlineLauncher()) {
    const observer = new MutationObserver(() => {
      if (placeOnlineLauncher()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (settingsDialog?.open) settingsDialog.close();
    if (shopDialog?.open) shopDialog.close();
  });
})();
