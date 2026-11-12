const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'www');
const gameFile = path.join(projectRoot, 'index_Version7.html');
const scriptsDir = __dirname;
const firebaseConfigFile = path.join(projectRoot, 'firebase-config.js');
const assets = [
  { source: path.join(scriptsDir, 'controller-smoothing.js'), output: 'scripts/controller-smoothing.js' },
  { source: path.join(scriptsDir, 'countdown.js'), output: 'scripts/countdown.js' },
  { source: path.join(scriptsDir, 'multiplayer.js'), output: 'scripts/multiplayer.js' }
];

for (const file of [gameFile, firebaseConfigFile, ...assets.map(asset => asset.source)]) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}

fs.mkdirSync(path.join(outputDir, 'scripts'), { recursive: true });
let html = fs.readFileSync(gameFile, 'utf8');
if (!html.includes('</body>')) throw new Error('Could not find </body> in game HTML');
html = html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*(?:firebase-config\.js|scripts\/(?:multiplayer|controller-smoothing|countdown)\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '\n');
const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const tags = [
  `<script src="firebase-config.js?v=${version}"></script>`,
  `<script src="scripts/controller-smoothing.js?v=${version}"></script>`,
  `<script src="scripts/countdown.js?v=${version}"></script>`,
  `<script src="scripts/multiplayer.js?v=${version}"></script>`
].join('\n');
html = html.replace('</body>', `${tags}\n</body>`);
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.copyFileSync(firebaseConfigFile, path.join(outputDir, 'firebase-config.js'));
for (const asset of assets) {
  const destination = path.join(outputDir, asset.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(asset.source, destination);
}

// Normalize Windows CRLF files before matching so the build patch works on PowerShell
// checkouts configured with core.autocrlf.
const multiplayerAsset = assets.find(asset => asset.output === 'scripts/multiplayer.js');
let multiplayer = fs.readFileSync(multiplayerAsset.source, 'utf8').replace(/\r\n?/g, '\n');
const oldInterpolation = /function interpolateGuest\(now\)\s*\{[\s\S]*?\n\s*\}\s*\n\s*function frame\(t\)\s*\{/;
const smoothInterpolation = `function interpolateGuest(now) {
    if (!state || !previousGuestState || !previousGuestReceivedAt || guestStateReceivedAt <= previousGuestReceivedAt) return state;
    const targetTime = now - 60;
    const rawAlpha = (targetTime - previousGuestReceivedAt) / (guestStateReceivedAt - previousGuestReceivedAt);
    const alpha = Math.max(0, Math.min(1, rawAlpha));
    const view = { ...state };
    for (const key of ['ballX','ballY','hostY','guestY']) {
      view[key] = previousGuestState[key] + (state[key] - previousGuestState[key]) * alpha;
    }
    const ahead = Math.max(0, Math.min(.12, (targetTime - guestStateReceivedAt) / 1000));
    if (ahead > 0 && roomStatus === 'playing') {
      view.ballX = state.ballX + state.ballVX * ahead;
      view.ballY = state.ballY + state.ballVY * ahead;
      if (view.ballY < BALL_R) view.ballY = BALL_R + (BALL_R - view.ballY);
      if (view.ballY > GAME_H - BALL_R) view.ballY = GAME_H - BALL_R - (view.ballY - (GAME_H - BALL_R));
      view.ballY = Math.max(BALL_R, Math.min(GAME_H - BALL_R, view.ballY));
    }
    return view;
  }
  function frame(t) {`;
if (!oldInterpolation.test(multiplayer)) {
  throw new Error('Could not find interpolateGuest() in scripts/multiplayer.js; build stopped without deploying.');
}
multiplayer = multiplayer.replace(oldInterpolation, smoothInterpolation);
multiplayer = multiplayer.replaceAll('t-lastPublish>40', 't-lastPublish>50');
multiplayer = multiplayer.replace('now - lastInputWrite < 25', 'now - lastInputWrite < 40');
multiplayer = multiplayer.replace('state.serve=.7;', 'state.serve=3;');
multiplayer = multiplayer.replace('serve: .65', 'serve: 3');
const countdownDrawAnchor = "    if(roomStatus==='waiting'||roomStatus==='idle'||roomStatus==='finished'){";
if (!multiplayer.includes(countdownDrawAnchor)) {
  throw new Error('Could not locate multiplayer court overlay for countdown; build stopped without deploying.');
}
multiplayer = multiplayer.replace(countdownDrawAnchor, `    if(roomStatus==='playing' && Number(s.serve)>0){c.fillStyle='#07101d99';c.fillRect(0,0,GAME_W,GAME_H);c.textAlign='center';c.fillStyle='white';c.font='900 96px system-ui';c.shadowColor='#32dcff';c.shadowBlur=24;c.fillText(String(Math.max(1,Math.ceil(s.serve))),GAME_W/2,GAME_H/2+30);c.shadowBlur=0;}
${countdownDrawAnchor}`);

const builtHtml = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
for (const required of ['controller-smoothing.js?v=', 'countdown.js?v=', 'multiplayer.js?v=']) {
  if (!builtHtml.includes(required)) throw new Error(`Build output is missing ${required}; build stopped.`);
}
if (!multiplayer.includes('const targetTime = now - 60;') || !multiplayer.includes('state.serve=3;')) {
  throw new Error('Multiplayer interpolation/countdown verification failed; build stopped.');
}
fs.writeFileSync(path.join(outputDir, 'scripts', 'multiplayer.js'), multiplayer);
console.log(`Built game with controller smoothing, start countdown, and multiplayer interpolation (asset version ${version}).`);
