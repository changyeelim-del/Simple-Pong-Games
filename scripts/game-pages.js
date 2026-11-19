(() => {
  'use strict';
  const canvas=document.getElementById('game'),settings=document.getElementById('settingsPanel'),shop=document.querySelector('.shop');
  if(!canvas)return;
  const overlay=document.createElement('section');overlay.id='gamePages';overlay.hidden=true;
  overlay.innerHTML=`<div class="game-page-card"><div class="game-page-nav"><button type="button" data-page="settings">⚙ Settings</button><button type="button" data-page="shop">🪙 Paddle Shop</button><button type="button" data-page="close" class="game-page-close">✕ Close</button></div><div id="gamePageSettings"></div><div id="gamePageShop"></div></div>`;
  document.body.append(overlay);
  const style=document.createElement('style');style.textContent=`#gamePages{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;overflow:auto;padding:14px;background:#070b12eF;color:#eef2ff;font:16px system-ui,sans-serif}#gamePages[hidden]{display:none}.game-page-card{width:min(760px,94vw);max-height:92vh;overflow:auto;border:1px solid #45d9ff;border-radius:12px;background:#101827;padding:12px;box-shadow:0 0 32px #31d9ff55}.game-page-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.game-page-nav button{border:0;border-radius:7px;padding:10px 12px;background:#45d9ff;color:#07121e;font-weight:700}.game-page-close{margin-left:auto!important;background:#ff8c9f!important}#gamePages .panel{display:block!important}#gamePages .shop{display:block!important;border:0;background:transparent}`;document.head.append(style);
  if(settings){$('gamePageSettings').append(settings);settings.hidden=false}if(shop){$('gamePageShop').append(shop);shop.hidden=false}
  function $$(id){return document.getElementById(id)}
  function show(page){overlay.hidden=false;if(page==='settings'){ $('gamePageSettings').hidden=false;$('gamePageShop').hidden=true}else if(page==='shop'){$('gamePageSettings').hidden=true;$('gamePageShop').hidden=false} }
  overlay.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;if(b.dataset.page==='close')overlay.hidden=true;else show(b.dataset.page)});
  const settingsButton=document.getElementById('settingsButton');if(settingsButton)settingsButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();show('settings')},true);
  let shopButton=document.getElementById('openPaddleShop');if(!shopButton){shopButton=document.createElement('button');shopButton.id='openPaddleShop';shopButton.textContent='🪙 Paddle Shop';shopButton.style.margin='8px';document.querySelector('main')?.append(shopButton)}shopButton.addEventListener('click',()=>show('shop'));overlay.hidden=true;
})();
