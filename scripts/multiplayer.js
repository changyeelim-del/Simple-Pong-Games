(() => {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
    #onlineEntry { margin: 8px auto; }
    #onlineOverlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; overflow:auto; padding: 14px; background: #070b12f2; color:#eef2ff; font: 16px system-ui,sans-serif; }
    #onlineOverlay[hidden] { display:none; }
    #onlineCard { width:min(820px,96vw); padding:14px; border:1px solid #45d9ff; border-radius:12px; background:#101827; box-shadow:0 0 35px #31d9ff44; text-align:center; }
    #onlineCard h2 { margin:4px 0 10px; }
    #onlineCard .online-row { display:flex; justify-content:center; align-items:center; gap:8px; flex-wrap:wrap; margin:9px 0; }
    #onlineCard button,#onlineCard input { border:0; border-radius:6px; padding:10px 12px; font:inherit; }
    #onlineCard button { background:#45d9ff; color:#07121e; font-weight:700; }
    #onlineCard button:disabled { opacity:.5; }
    #onlineCard input { width:150px; background:#202942; color:white; border:1px solid #45d9ff; text-transform:uppercase; }
    #onlineStatus { min-height:1.5em; color:#bfefff; }
    #onlineCanvas { display:block; width:100%; height:auto; border:2px solid #45d9ff; border-radius:8px; background:#101b2c; touch-action:none; }
    #onlineExit { background:#ff8c9f!important; }
  `;
  document.head.append(style);

  const entry = document.createElement('div');
  entry.id = 'onlineEntry';
  entry.innerHTML = '<button type="button">🌐 Online Multiplayer</button>';
  document.querySelector('main')?.append(entry);
  const overlay = document.createElement('section');
  overlay.id = 'onlineOverlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div id="onlineCard">
      <h2>Room-code Multiplayer</h2>
      <div class="online-row"><button id="onlineCreate">Create room</button><input id="onlineCode" maxlength="8" autocomplete="off" placeholder="ROOM CODE" aria-label="Room code"><button id="onlineJoin">Join room</button></div>
      <div id="onlineStatus" role="status">Create a room and share its code, or enter a friend's code.</div>
      <div id="onlineRoom" hidden><div class="online-row"><strong>Room code: <span id="onlineCodeDisplay"></span></strong><button id="onlineCopy">Copy code</button></div><canvas id="onlineCanvas" width="800" height="500" aria-label="Online Pong court"></canvas><p>Drag on the court or use ↑ / ↓. First to 5 wins.</p></div>
      <div class="online-row"><button id="onlineExit">Back to game</button></div>
    </div>`;
  document.body.append(overlay);

  const $ = id => document.getElementById(id);
  const statusEl = $('onlineStatus');
  const setStatus = text => { statusEl.textContent = text; };
  const config = window.PONG_FIREBASE_CONFIG;
  let db = null, auth = null, uid = null, roomRef = null, roomCode = '', role = '', state = null;
  let roomUnsub = null, stateUnsub = null, guestInputUnsub = null, inputTimer = 0;
  let raf = 0, lastFrame = 0, lastPublish = 0, lastInputWrite = 0, localY = 250;
  let isVisible = false, roomStatus = 'idle';
  const gameCanvas = $('onlineCanvas'), gameCtx = gameCanvas.getContext('2d');
  const GAME_W = 800, GAME_H = 500, PAD_W = 14, PAD_H = 90, BALL_R = 9;

  function loadSdk(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.onload = resolve; script.onerror = () => reject(new Error('Could not load Firebase SDK. Check your internet connection.'));
      document.head.append(script);
    });
  }
  async function connectFirebase() {
    if (db && auth && uid) return;
    if (!config || !config.apiKey || config.apiKey.startsWith('YOUR_') || !config.databaseURL || config.databaseURL.includes('YOUR_')) {
      throw new Error('Firebase is not configured yet. Follow the Firebase setup steps in README.md, then rebuild/sync.');
    }
    if (!window.firebase?.database) {
      const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
      await loadSdk(base + 'firebase-app-compat.js');
      await loadSdk(base + 'firebase-auth-compat.js');
      await loadSdk(base + 'firebase-database-compat.js');
    }
    if (!firebase.apps.length) firebase.initializeApp(config);
    auth = firebase.auth(); db = firebase.database();
    if (!auth.currentUser) await auth.signInAnonymously();
    uid = auth.currentUser.uid;
  }
  function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8); crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  }
  function initialState() { return { ballX:400, ballY:250, ballVX:300, ballVY:90, hostY:205, guestY:205, hostScore:0, guestScore:0, serve:0.65, winner:'', updatedAt:Date.now() }; }
  function stopListeners() {
    if (roomUnsub) roomRef?.off('value', roomUnsub);
    if (stateUnsub) roomRef?.child('state').off('value', stateUnsub);
    if (guestInputUnsub) roomRef?.child('inputs/guest').off('value', guestInputUnsub);
    roomUnsub = stateUnsub = guestInputUnsub = null;
    clearInterval(inputTimer); inputTimer = 0;
    cancelAnimationFrame(raf); raf = 0;
  }
  function resetRoomUi() {
    stopListeners(); roomRef = null; roomCode = ''; role = ''; state = null; roomStatus = 'idle';
    $('onlineRoom').hidden = true; $('onlineCreate').disabled = $('onlineJoin').disabled = false;
    $('onlineCode').disabled = false; $('onlineCodeDisplay').textContent = '';
  }
  function enterOverlay() { isVisible = true; overlay.hidden = false; }
  async function createRoom() {
    $('onlineCreate').disabled = $('onlineJoin').disabled = true;
    try {
      await connectFirebase();
      for (let attempt = 0; attempt < 4; attempt++) {
        roomCode = randomCode(); roomRef = db.ref('rooms/' + roomCode);
        const existing = await roomRef.child('hostUid').once('value');
        if (existing.exists()) continue;
        await roomRef.child('hostUid').set(uid);
        await Promise.all([
          roomRef.child('status').set('waiting'),
          roomRef.child('createdAt').set(firebase.database.ServerValue.TIMESTAMP),
          roomRef.child('state').set(initialState()),
          roomRef.child('inputs/host').set(250)
        ]);
        role = 'host'; state = initialState();
        $('onlineCodeDisplay').textContent = roomCode; $('onlineRoom').hidden = false;
        $('onlineCode').value = roomCode; $('onlineCode').disabled = true;
        $('onlineCreate').disabled = true;
        setStatus('Room created. Share the code and wait for your friend to join.');
        watchRoom(); return;
      }
      throw new Error('Could not find an unused room code. Please try again.');
    } catch (error) { resetRoomUi(); setStatus(error.message || 'Could not create room.'); }
  }
  async function joinRoom() {
    const code = $('onlineCode').value.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) { setStatus('Enter the 8-character room code.'); return; }
    $('onlineCreate').disabled = $('onlineJoin').disabled = true;
    try {
      await connectFirebase(); roomCode = code; roomRef = db.ref('rooms/' + roomCode);
      const roomSnap = await roomRef.once('value');
      if (!roomSnap.exists()) throw new Error('Room not found. Check the code and try again.');
      const room = roomSnap.val();
      if (room.hostUid === uid) throw new Error('You cannot join your own room on the same account.');
      if (room.status !== 'waiting' || room.guestUid) throw new Error('That room already has a player or has started.');
      const claim = await roomRef.child('guestUid').transaction(value => value == null ? uid : undefined);
      if (!claim.committed || claim.snapshot.val() !== uid) throw new Error('Another player joined first. Ask for a new room code.');
      await roomRef.child('inputs/guest').set(250);
      role = 'guest'; $('onlineCodeDisplay').textContent = roomCode; $('onlineRoom').hidden = false; $('onlineCode').disabled = true;
      setStatus('Joined! Waiting for the host to start the match.'); watchRoom();
    } catch (error) { resetRoomUi(); $('onlineCode').value = code; setStatus(error.message || 'Could not join room.'); }
  }
  function watchRoom() {
    roomUnsub = snap => {
      if (!snap.exists()) { setStatus('The room was closed.'); resetRoomUi(); return; }
      const room = snap.val();
      if (role === 'host' && room.guestUid) {
        if (room.status === 'waiting') roomRef.child('status').set('playing');
        setStatus('Player joined! Match in progress.');
      } else if (role === 'host') setStatus('Room created. Share the code and wait for your friend to join.');
      if (role === 'guest' && room.status === 'playing') setStatus('Match in progress! You control the right paddle.');
      if (room.status === 'finished' && room.state?.winner) setStatus(room.state.winner === role ? 'You won!' : 'You lost!');
      roomStatus = room.status;
      if (room.status === 'playing') startGameLoop();
      else if (room.status !== 'playing') { cancelAnimationFrame(raf); raf = 0; draw(); }
    };
    roomRef.on('value', roomUnsub);
    stateUnsub = snap => { state = snap.val(); draw(); };
    roomRef.child('state').on('value', stateUnsub);
    if (role === 'host') {
      roomRef.child('inputs/guest').on('value', snap => { if (state && Number.isFinite(snap.val())) state.guestY = snap.val(); });
    }
  }
  function startGameLoop() { if (raf || !isVisible || !roomRef || roomStatus !== 'playing') return; lastFrame = 0; raf = requestAnimationFrame(frame); }
  function clampY(y, height = PAD_H) { return Math.max(height/2, Math.min(GAME_H-height/2, y)); }
  function publishInput() {
    if (!roomRef || !role || roomStatus !== 'playing') return;
    const key = role === 'host' ? 'host' : 'guest';
    const path = roomRef.child('inputs/' + key);
    const now = performance.now();
    if (now - lastInputWrite < 45) return;
    lastInputWrite = now; path.set(clampY(localY)).catch(() => setStatus('Connection interrupted while sending paddle input.'));
  }
  function hostUpdate(dt) {
    if (!state || roomStatus !== 'playing') return;
    state.hostY = clampY(state.hostY); state.guestY = clampY(state.guestY);
    if (state.serve > 0) { state.serve = Math.max(0, state.serve - dt); return; }
    state.ballX += state.ballVX * dt; state.ballY += state.ballVY * dt;
    if (state.ballY - BALL_R < 0) { state.ballY = BALL_R; state.ballVY = Math.abs(state.ballVY); }
    if (state.ballY + BALL_R > GAME_H) { state.ballY = GAME_H - BALL_R; state.ballVY = -Math.abs(state.ballVY); }
    const paddles = [{x:28,y:state.hostY-PAD_H/2,side:'host'},{x:GAME_W-42,y:state.guestY-PAD_H/2,side:'guest'}];
    for (const p of paddles) {
      const movingToward = p.side === 'host' ? state.ballVX < 0 : state.ballVX > 0;
      if (movingToward && state.ballX + BALL_R > p.x && state.ballX - BALL_R < p.x + PW && state.ballY + BALL_R > p.y && state.ballY - BALL_R < p.y + PAD_H) {
        const offset = Math.max(-1, Math.min(1, (state.ballY - (p.y + PAD_H/2)) / (PAD_H/2)));
        const dir = p.side === 'host' ? 1 : -1;
        const velocity = Math.min(Math.hypot(state.ballVX,state.ballVY)*1.035,650);
        state.ballVX = dir*velocity*Math.cos(offset*.85); state.ballVY = velocity*Math.sin(offset*.85);
        state.ballX = p.side === 'host' ? p.x+PW+BALL_R : p.x-BALL_R;
      }
    }
    let scored = false;
    if (state.ballX + BALL_R < 0) { state.guestScore++; scored = true; }
    else if (state.ballX - BALL_R > GAME_W) { state.hostScore++; scored = true; }
    if (scored) {
      const winner = state.hostScore >= 5 ? 'host' : state.guestScore >= 5 ? 'guest' : '';
      if (winner) { state.winner=winner; roomStatus='finished'; roomRef.child('state').set(state); roomRef.child('status').set('finished'); return; }
      const dir = state.hostScore > state.guestScore ? -1 : 1;
      state.ballX=GAME_W/2;state.ballY=GAME_H/2;state.ballVX=300*dir;state.ballVY=(Math.random()*180-90);state.serve=.7;
    }
  }
  function frame(t) {
    raf = 0;
    if (!isVisible || roomStatus !== 'playing' || !roomRef) return;
    const dt = Math.min(((t-lastFrame)/1000)||0,.035); lastFrame=t;
    if (role === 'host') {
      hostUpdate(dt);
      if (state) { state.hostY=clampY(state.hostY); state.guestY=clampY(state.guestY); if (t-lastPublish>45) { lastPublish=t; state.updatedAt=Date.now(); roomRef.child('state').set(state).catch(()=>setStatus('Lost connection to room.')); } }
    } else if (role === 'guest' && state) {
      state.guestY=clampY(localY);
    }
    draw(); raf=requestAnimationFrame(frame);
  }
  function draw() {
    const c=gameCtx;c.fillStyle='#0c1727';c.fillRect(0,0,GAME_W,GAME_H);c.strokeStyle='#32dcff44';c.lineWidth=1;
    for(let y=70;y<GAME_H;y+=65){c.beginPath();c.moveTo(0,y);c.lineTo(GAME_W,y);c.stroke();}
    c.setLineDash([8,12]);c.strokeStyle='#49dfff99';c.lineWidth=3;c.beginPath();c.moveTo(GAME_W/2,0);c.lineTo(GAME_W/2,GAME_H);c.stroke();c.setLineDash([]);
    const s=state||initialState();c.textAlign='center';c.font='bold 42px system-ui';c.fillStyle='#eefaff';c.fillText(s.hostScore||0,GAME_W/2-60,55);c.fillText(s.guestScore||0,GAME_W/2+60,55);
    c.shadowBlur=16;c.fillStyle='#32dcff';c.shadowColor=c.fillStyle;c.fillRect(28,clampY(s.hostY)-PAD_H/2,PW,PAD_H);
    c.fillStyle='#ff69c7';c.shadowColor=c.fillStyle;c.fillRect(GAME_W-42,clampY(s.guestY)-PAD_H/2,PW,PAD_H);
    c.beginPath();c.arc(s.ballX||GAME_W/2,s.ballY||GAME_H/2,BALL_R,0,Math.PI*2);c.fillStyle='white';c.shadowColor='white';c.fill();c.shadowBlur=0;
    if(roomStatus==='waiting'||roomStatus==='idle'||roomStatus==='finished'){c.fillStyle='#07101dcc';c.fillRect(0,0,GAME_W,GAME_H);c.fillStyle='white';c.font='bold 28px system-ui';c.fillText(roomStatus==='waiting'?'WAITING FOR PLAYER':roomStatus==='finished'?(s.winner===role?'YOU WIN!':'MATCH OVER'):'CREATE OR JOIN A ROOM',GAME_W/2,GAME_H/2);}
  }
  function setLocalY(event) { const rect=gameCanvas.getBoundingClientRect();localY=clampY((event.clientY-rect.top)*GAME_H/rect.height);publishInput(); }
  async function leaveRoom() {
    const oldRef=roomRef, oldRole=role; stopListeners(); raf=0;
    try {
      if (oldRef && oldRole==='host') await oldRef.remove();
      else if (oldRef && oldRole==='guest') await oldRef.child('guestUid').remove();
    } catch (e) { console.warn('Room cleanup failed:',e); }
    resetRoomUi(); setStatus('Create a room and share its code, or enter a friend\'s code.');
  }
  entry.querySelector('button').addEventListener('click',()=>{enterOverlay();});
  $('onlineCreate').addEventListener('click',createRoom);$('onlineJoin').addEventListener('click',joinRoom);
  $('onlineCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomCode);setStatus('Room code copied. Send it to your friend.');}catch{setStatus(`Share this room code: ${roomCode}`);}});
  $('onlineExit').addEventListener('click',async()=>{isVisible=false;await leaveRoom();overlay.hidden=true;});
  gameCanvas.addEventListener('pointerdown',setLocalY);gameCanvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||e.buttons)setLocalY(e);});
  window.addEventListener('keydown',e=>{if(!isVisible)return;if(e.key==='Escape'){overlay.hidden=true;isVisible=false;return;}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();localY=clampY(localY+(e.key==='ArrowUp'?-24:24));publishInput();}});
  window.addEventListener('keyup',()=>{});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else startGameLoop();});
  window.addEventListener('beforeunload',()=>{stopListeners();});
  draw();
})();
