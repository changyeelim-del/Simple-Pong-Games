const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'www');
const gameFile = path.join(projectRoot, 'index_Version7.html');
const multiplayerFile = path.join(__dirname, 'multiplayer.js');
const controllerFile = path.join(__dirname, 'controller-smoothing.js');
const firebaseConfigFile = path.join(projectRoot, 'firebase-config.js');

for (const file of [gameFile, multiplayerFile, controllerFile, firebaseConfigFile]) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}

fs.mkdirSync(path.join(outputDir, 'scripts'), { recursive: true });
let html = fs.readFileSync(gameFile, 'utf8');
const buildVersion = Date.now().toString(36);
const injection = `\n<script src="firebase-config.js?v=${buildVersion}"></script>\n<script src="scripts/controller-smoothing.js?v=${buildVersion}"></script>\n<script src="scripts/multiplayer.js?v=${buildVersion}"></script>\n`;
if (!html.includes('scripts/multiplayer.js')) {
  if (!html.includes('</body>')) throw new Error('Could not find </body> in game HTML');
  html = html.replace('</body>', `${injection}</body>`);
}
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.copyFileSync(multiplayerFile, path.join(outputDir, 'scripts', 'multiplayer.js'));
fs.copyFileSync(controllerFile, path.join(outputDir, 'scripts', 'controller-smoothing.js'));
fs.copyFileSync(firebaseConfigFile, path.join(outputDir, 'firebase-config.js'));
console.log(`Built game and room-code multiplayer into www/ (asset version ${buildVersion})`);
