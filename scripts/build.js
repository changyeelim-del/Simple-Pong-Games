const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'www');
const sourceHtml = path.join(root, 'index_Version7.html');
const firebaseConfig = path.join(root, 'firebase-config.js');
const scriptNames = [
  'controller-smoothing.js',
  'countdown.js',
  'game-pages.js',
  'boss-effects.js',
  'multiplayer.js'
];
const scriptFiles = scriptNames.map(name => path.join(__dirname, name));

for (const file of [sourceHtml, firebaseConfig, ...scriptFiles]) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}

fs.mkdirSync(path.join(output, 'scripts'), { recursive: true });
let html = fs.readFileSync(sourceHtml, 'utf8');
if (!html.includes('</body>')) throw new Error('Could not find </body> in game HTML');

// Restore Version 4's hover-to-move mouse control: the pointermove handler should
// update the paddle even when the mouse button is not pressed.
const mouseGuard = "if(e.pointerType==='mouse'&&e.buttons===0)return;";
if (html.includes(mouseGuard)) html = html.replace(mouseGuard, '');
else if (!html.includes("canvas.addEventListener('pointermove'")) throw new Error('Could not find the game pointermove handler');

html = html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*(?:firebase-config\.js|scripts\/(?:controller-smoothing|countdown|game-pages|boss-effects|multiplayer)\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '\n');
const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const scriptTags = [
  `<script src="firebase-config.js?v=${version}"></script>`,
  ...scriptNames.map(name => `<script src="scripts/${name}?v=${version}"></script>`)
].join('\n');
html = html.replace('</body>', `${scriptTags}\n</body>`);
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.copyFileSync(firebaseConfig, path.join(output, 'firebase-config.js'));
for (const file of scriptFiles) fs.copyFileSync(file, path.join(output, 'scripts', path.basename(file)));

const builtHtml = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
if (!builtHtml.includes('value="multiplayer"')) throw new Error('Multiplayer mode option was not injected');
if (builtHtml.includes(mouseGuard)) throw new Error('Mouse hover control guard was not removed');
for (const name of scriptNames) {
  if (!builtHtml.includes(`scripts/${name}?v=${version}`)) throw new Error(`Build output is missing ${name}`);
}
console.log(`Built game with mode-selector multiplayer and hover-to-move controls (version ${version}).`);
